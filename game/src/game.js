// Ember Duel — game state and rules.
// One match: two heroes, 30 life each, mana crystals that grow by 1 every turn
// (up to 10). Creatures fight on the table; spells strike at once. A creature
// cannot attack on the turn it is played (summoning sickness), and every
// creature on your table gets to attack once per turn.

import { buildDeck, findCard } from './cards.js';

export const STARTING_LIFE = 30;
export const MAX_MANA = 10;
export const MAX_HAND = 7;
export const MAX_BOARD = 7;
export const STARTING_HAND = 3;

export function createPlayer(name, isAi) {
  return {
    name,
    isAi,
    life: STARTING_LIFE,
    mana: 0,
    maxMana: 0,
    deck: [],
    hand: [],
    board: [],
    fatigue: 0,
  };
}

export function createGame(random = Math.random) {
  const game = {
    phase: 'title', // title | playing | won | lost
    turn: 0,
    turnOwner: 'player',
    player: createPlayer('Kamu', false),
    enemy: createPlayer('Raka si Lawan', true),
    log: [],
    winner: null,
    random,
  };
  game.player.deck = buildDeck(random);
  game.enemy.deck = buildDeck(random);
  return game;
}

export function startMatch(game) {
  game.phase = 'playing';
  game.turn = 1;
  game.turnOwner = 'player';
  for (let i = 0; i < STARTING_HAND; i += 1) {
    drawCard(game, game.player);
    drawCard(game, game.enemy);
  }
  beginTurn(game, game.player);
  addLog(game, 'Pertandingan dimulai! Giliranmu — mainkan kartumu.');
}

export function drawCard(game, owner) {
  if (owner.hand.length >= MAX_HAND) {
    owner.deck.shift();
    addLog(game, `${owner.name} tangannya penuh, kartu terbuang.`);
    return null;
  }
  const card = owner.deck.shift();
  if (!card) {
    owner.fatigue += 1;
    owner.life -= owner.fatigue;
    addLog(game, `${owner.name} kehabisan kartu! Lelah ${owner.fatigue} damage.`);
    checkEnd(game);
    return null;
  }
  owner.hand.push(card);
  return card;
}

export function beginTurn(game, owner) {
  owner.maxMana = Math.min(MAX_MANA, owner.maxMana + 1);
  owner.mana = owner.maxMana;
  owner.board.forEach((creature) => { creature.canAttack = true; });
  drawCard(game, owner);
}

export function endTurn(game) {
  if (game.phase !== 'playing' || game.turnOwner !== 'player') return false;
  game.turnOwner = 'enemy';
  addLog(game, 'Giliran lawan...');
  return true;
}

export function canPlayCard(game, owner, card) {
  if (game.phase !== 'playing') return false;
  if (owner !== currentPlayer(game)) return false;
  if (card.cost > owner.mana) return false;
  if (card.type === 'creature' && owner.board.length >= MAX_BOARD) return false;
  return true;
}

export function currentPlayer(game) {
  return game.turnOwner === 'player' ? game.player : game.enemy;
}

export function opponentOf(game, owner) {
  return owner === game.player ? game.enemy : game.player;
}

export function playCard(game, owner, cardUid) {
  const index = owner.hand.findIndex((card) => card.uid === cardUid);
  if (index < 0) return { ok: false, reason: 'Kartu tidak ada di tangan.' };
  const card = owner.hand[index];
  if (!canPlayCard(game, owner, card)) {
    return { ok: false, reason: 'Mana tidak cukup atau papan penuh.' };
  }
  owner.hand.splice(index, 1);
  owner.mana -= card.cost;
  if (card.type === 'creature') {
    card.canAttack = false;
    owner.board.push(card);
    addLog(game, `${owner.name} memainkan ${card.name} (${card.attack}/${card.health}).`);
    if (card.effect && card.effect.kind === 'heal') {
      healHero(game, owner, card.effect.amount);
    }
  } else {
    resolveSpell(game, owner, card);
  }
  checkEnd(game);
  return { ok: true, card };
}

export function resolveSpell(game, owner, card) {
  const foe = opponentOf(game, owner);
  const effect = card.effect;
  if (!effect) return;
  switch (effect.kind) {
    case 'damageHero':
      dealDamage(game, foe, effect.amount);
      addLog(game, `${card.name}: ${effect.amount} damage ke ${foe.name}!`);
      break;
    case 'heal':
      healHero(game, owner, effect.amount);
      addLog(game, `${card.name}: ${owner.name} pulih ${effect.amount} nyawa.`);
      break;
    case 'draw':
      for (let i = 0; i < effect.amount; i += 1) drawCard(game, owner);
      addLog(game, `${card.name}: ${owner.name} menarik ${effect.amount} kartu.`);
      break;
    case 'healDraw':
      healHero(game, owner, effect.amount);
      drawCard(game, owner);
      addLog(game, `${card.name}: pulih ${effect.amount} nyawa, tarik 1 kartu.`);
      break;
    case 'damageDraw':
      dealDamage(game, foe, effect.amount);
      drawCard(game, owner);
      addLog(game, `${card.name}: ${effect.amount} damage, tarik 1 kartu.`);
      break;
    case 'damageRandom': {
      const target = foe.board[Math.floor(game.random() * foe.board.length)];
      if (target) {
        damageCreature(game, foe, target, effect.amount);
        addLog(game, `${card.name}: ${effect.amount} damage ke ${target.name}.`);
      } else {
        dealDamage(game, foe, effect.amount);
        addLog(game, `${card.name}: tidak ada makhluk, ${effect.amount} damage ke ${foe.name}.`);
      }
      break;
    }
    case 'damageAll':
      foe.board.slice().forEach((creature) => damageCreature(game, foe, creature, effect.amount));
      dealDamage(game, foe, 1);
      addLog(game, `${card.name}: semua makhluk lawan kena ${effect.amount} damage.`);
      break;
    default:
      break;
  }
}

export function dealDamage(game, owner, amount) {
  owner.life = Math.max(0, owner.life - amount);
}

export function healHero(game, owner, amount) {
  owner.life = Math.min(STARTING_LIFE, owner.life + amount);
}

export function damageCreature(game, owner, creature, amount) {
  creature.health -= amount;
  if (creature.health <= 0) {
    owner.board = owner.board.filter((item) => item.uid !== creature.uid);
    addLog(game, `${creature.name} hancur!`);
  }
}

export function attackWith(game, attackerOwner, attackerUid, targetUid) {
  const attacker = attackerOwner.board.find((card) => card.uid === attackerUid);
  if (!attacker) return { ok: false, reason: 'Penyerang tidak ada di papan.' };
  if (!attacker.canAttack) return { ok: false, reason: 'Makhluk ini sudah menyerang atau baru dimainkan.' };
  if (game.phase !== 'playing' || attackerOwner !== currentPlayer(game)) {
    return { ok: false, reason: 'Bukan giliranmu.' };
  }
  const foe = opponentOf(game, attackerOwner);
  attacker.canAttack = false;
  if (targetUid === 'hero') {
    dealDamage(game, foe, attacker.attack);
    addLog(game, `${attacker.name} menyerang ${foe.name} (${attacker.attack} damage).`);
  } else {
    const target = foe.board.find((card) => card.uid === targetUid);
    if (!target) return { ok: false, reason: 'Target tidak ada.' };
    damageCreature(game, foe, target, attacker.attack);
    damageCreature(game, attackerOwner, attacker, target.attack);
    addLog(game, `${attacker.name} bertarung dengan ${target.name}.`);
  }
  checkEnd(game);
  return { ok: true };
}

export function checkEnd(game) {
  if (game.phase !== 'playing') return;
  if (game.player.life <= 0 && game.enemy.life <= 0) {
    game.phase = 'drawn';
    game.winner = 'draw';
    addLog(game, 'Keduanya tumbang — seri!');
  } else if (game.enemy.life <= 0) {
    game.phase = 'won';
    game.winner = 'player';
    addLog(game, 'Kamu menang! Raka si Lawan tumbang.');
  } else if (game.player.life <= 0) {
    game.phase = 'lost';
    game.winner = 'enemy';
    addLog(game, 'Kamu kalah. Raka si Lawan menang.');
  }
}

export function addLog(game, message) {
  game.log.push(message);
  if (game.log.length > 8) game.log.shift();
}

export function describeCard(card) {
  const def = findCard(card.id);
  const stats = card.type === 'creature'
    ? `${card.attack} serangan / ${card.health} nyawa`
    : 'mantra sekali pakai';
  return `${card.name} — ${def ? ELEMENT_NAME(card.element) : ''}, biaya ${card.cost} mana, ${stats}. ${card.text}`;
}

export function ELEMENT_NAME(element) {
  return { api: 'Api', ombak: 'Ombak', duri: 'Duri', angin: 'Angin' }[element] ?? element;
}
