// Ember Duel — the opponent's brain.
// Raka plays by rules you can read and counter:
//   1. He spends his mana on the biggest creature he can afford first,
//      then on spells that hurt you or heal him.
//   2. He draws cards when his hand runs low.
//   3. His creatures attack your weakest creature when one is nearly dead,
//      otherwise they go straight for your hero.
// He is beatable: hold a cheap removal spell for his big creature, and
// trade your creatures into his before they can hit your hero.

import {
  attackWith, beginTurn, canPlayCard, checkEnd, playCard,
} from './game.js';

const THINK_DELAY_MS = 650;

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function scoreCardForAi(card, game) {
  // Bigger creatures first; damage spells when the player is low; healing when hurt.
  if (card.type === 'creature') return card.cost * 10 + card.attack * 3 + card.health;
  if (!card.effect) return 0;
  switch (card.effect.kind) {
    case 'damageHero':
      return game.player.life <= card.effect.amount + 4 ? 90 : 30 + card.effect.amount;
    case 'heal':
      return game.enemy.life < 18 ? 70 : 10;
    case 'draw':
      return game.enemy.hand.length <= 2 ? 60 : 15;
    case 'healDraw':
      return game.enemy.life < 22 ? 75 : 35;
    case 'damageDraw':
      return 55;
    case 'damageRandom':
      return game.player.board.length > 0 ? 50 : 25;
    case 'damageAll':
      return game.player.board.length >= 2 ? 65 : 20;
    default:
      return 20;
  }
}

export function chooseCardToPlay(game) {
  const enemy = game.enemy;
  const playable = enemy.hand.filter((card) => canPlayCard(game, enemy, card));
  if (playable.length === 0) return null;
  playable.sort((a, b) => scoreCardForAi(b, game) - scoreCardForAi(a, game));
  return playable[0];
}

export function chooseAttackTarget(game, attacker) {
  const playerBoard = game.player.board;
  const weak = playerBoard
    .filter((creature) => creature.health <= attacker.attack)
    .sort((a, b) => a.health - b.health)[0];
  if (weak) return weak.uid;
  return 'hero';
}

export async function takeAiTurn(game, hooks) {
  // hooks: { onStep } called after every visible action so the table re-renders.
  const step = () => { if (hooks && hooks.onStep) hooks.onStep(); };
  await sleep(THINK_DELAY_MS);
  beginTurn(game, game.enemy);
  step();

  let safety = 0;
  let card = chooseCardToPlay(game);
  while (card && safety < 12) {
    safety += 1;
    playCard(game, game.enemy, card.uid);
    if (hooks && hooks.onPlay) hooks.onPlay(card);
    step();
    await sleep(THINK_DELAY_MS);
    if (game.phase !== 'playing') return;
    card = chooseCardToPlay(game);
  }

  const attackers = game.enemy.board.filter((creature) => creature.canAttack);
  for (const attacker of attackers) {
    const target = chooseAttackTarget(game, attacker);
    attackWith(game, game.enemy, attacker.uid, target);
    if (hooks && hooks.onAttack) hooks.onAttack(attacker, target);
    step();
    await sleep(THINK_DELAY_MS * 0.8);
    if (game.phase !== 'playing') return;
  }

  checkEnd(game);
  if (game.phase !== 'playing') return;
  game.turnOwner = 'player';
  game.turn += 1;
  beginTurn(game, game.player);
  step();
}
