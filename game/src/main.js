// Ember Duel — bootstrap and input.
// Wires the game state to the renderer, handles mouse and keyboard input,
// runs the AI turn, and plays sounds. Demo hooks (?demo=table / win / loss)
// force a starting state for screenshots; a normal load always opens on the
// title screen and plays a full match.

import { findCard } from './cards.js';
import {
  attackWith, canPlayCard, createGame, drawCard,
  endTurn, playCard, startMatch,
} from './game.js';
import { takeAiTurn } from './ai.js';
import { renderEndScreen, renderTable, renderTitle } from './render.js';
import {
  ensureAudio, isMuted, playAttackSound, playCardSound, playDrawSound,
  playErrorSound, playHealSound, playLoseSound, playSpellSound,
  playTurnSound, playWinSound, toggleMute,
} from './audio.js';

const root = document.getElementById('app');
const game = createGame();
let aiRunning = false;
let selectedCardUid = null;
let selectedAttackerUid = null;
let endSoundPlayedFor = null;

function playSoundFor(card) {
  if (!card) return;
  if (card.type === 'spell') {
    if (card.effect && (card.effect.kind === 'heal' || card.effect.kind === 'healDraw')) playHealSound();
    else playSpellSound();
  } else {
    playCardSound();
  }
}

function refresh() {
  if (game.phase === 'title') {
    renderTitle(root, startPlaying, () => ensureAudio());
  } else if (game.phase === 'won' || game.phase === 'lost' || game.phase === 'drawn') {
    // Play the end fanfare exactly once per finished match, not on every render.
    if (endSoundPlayedFor !== game.phase) {
      endSoundPlayedFor = game.phase;
      if (game.phase === 'won') playWinSound();
      else playLoseSound();
    }
    renderEndScreen(game, root, restart);
  } else {
    endSoundPlayedFor = null;
    renderTable(game, uiCallbacks(), root);
  }
}

function uiCallbacks() {
  return {
    muted: isMuted(),
    selectedCardUid,
    selectedAttacker: selectedAttackerUid,
    onHandCardClick,
    onOwnCreatureClick,
    onEnemyCreatureClick,
    onHeroClick,
    onEndTurn,
    onToggleMute,
  };
}

function onHandCardClick(uid) {
  if (game.phase !== 'playing' || game.turnOwner !== 'player' || aiRunning) return;
  ensureAudio();
  if (selectedCardUid === uid) {
    tryPlaySelected();
    return;
  }
  selectedCardUid = uid;
  selectedAttackerUid = null;
  playDrawSound();
  refresh();
}

function tryPlaySelected() {
  if (!selectedCardUid) return;
  const card = game.player.hand.find((item) => item.uid === selectedCardUid);
  if (!card) { selectedCardUid = null; return; }
  if (!canPlayCard(game, game.player, card)) {
    playErrorSound();
    return;
  }
  const result = playCard(game, game.player, selectedCardUid);
  selectedCardUid = null;
  if (result.ok) playSoundFor(result.card);
  refresh();
  if (game.phase === 'playing') maybeStartAiTurn();
}

function onOwnCreatureClick(uid) {
  if (game.phase !== 'playing' || game.turnOwner !== 'player' || aiRunning) return;
  ensureAudio();
  const creature = game.player.board.find((item) => item.uid === uid);
  if (!creature) return;
  if (!creature.canAttack) {
    playErrorSound();
    return;
  }
  selectedAttackerUid = selectedAttackerUid === uid ? null : uid;
  selectedCardUid = null;
  refresh();
}

function onEnemyCreatureClick(uid) {
  if (selectedAttackerUid) attackTarget(uid);
}

function onHeroClick(which) {
  if (which === 'enemy' && selectedAttackerUid) attackTarget('hero');
}

function attackTarget(targetUid) {
  const result = attackWith(game, game.player, selectedAttackerUid, targetUid);
  selectedAttackerUid = null;
  if (result.ok) playAttackSound();
  else playErrorSound();
  refresh();
  if (game.phase === 'playing') maybeStartAiTurn();
}

function onEndTurn() {
  if (game.phase !== 'playing' || game.turnOwner !== 'player' || aiRunning) return;
  ensureAudio();
  selectedCardUid = null;
  selectedAttackerUid = null;
  playTurnSound();
  endTurn(game);
  refresh();
  maybeStartAiTurn();
}

function onToggleMute() {
  ensureAudio();
  toggleMute();
  refresh();
}

async function maybeStartAiTurn() {
  if (game.phase !== 'playing' || game.turnOwner !== 'enemy' || aiRunning) return;
  aiRunning = true;
  await takeAiTurn(game, {
    onStep: () => refresh(),
    onPlay: (card) => playSoundFor(card),
    onAttack: () => playAttackSound(),
  });
  aiRunning = false;
  refresh();
  if (game.phase === 'playing' && game.turnOwner === 'player') playTurnSound();
}

function startPlaying() {
  ensureAudio();
  playTurnSound();
  startMatch(game);
  selectedCardUid = null;
  selectedAttackerUid = null;
  refresh();
}

function restart() {
  const fresh = createGame();
  game.phase = fresh.phase;
  game.turn = fresh.turn;
  game.turnOwner = fresh.turnOwner;
  game.player = fresh.player;
  game.enemy = fresh.enemy;
  game.log = fresh.log;
  game.winner = fresh.winner;
  selectedCardUid = null;
  selectedAttackerUid = null;
  aiRunning = false;
  startPlaying();
}

function selectHandIndex(index) {
  const card = game.player.hand[index];
  if (!card) return;
  selectedCardUid = card.uid;
  selectedAttackerUid = null;
  playDrawSound();
  refresh();
}

document.addEventListener('keydown', (event) => {
  if (game.phase === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    startPlaying();
    return;
  }
  if ((game.phase === 'won' || game.phase === 'lost' || game.phase === 'drawn') && event.key === 'Enter') {
    event.preventDefault();
    restart();
    return;
  }
  if (game.phase !== 'playing' || aiRunning) return;
  if (event.key >= '1' && event.key <= '7') {
    selectHandIndex(Number(event.key) - 1);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    tryPlaySelected();
  } else if (event.key === 'e' || event.key === 'E') {
    onEndTurn();
  } else if (event.key === 'Escape') {
    selectedCardUid = null;
    selectedAttackerUid = null;
    refresh();
  } else if (event.key === 'm' || event.key === 'M') {
    onToggleMute();
  }
});

// Demo hooks for screenshots only: they render honest states of this same
// game code. A normal visit (no query) always starts on the title screen.
function applyDemoHook() {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  if (!demo) return false;
  // Still shots: skip the 0.35s deal animation so a screenshot never catches
  // the cards mid-flight. The game itself is unchanged.
  document.body.classList.add('demo-shot');
  startMatch(game);
  if (demo === 'table') {
    // Mid-game: both boards populated, hands full, life totals differ.
    game.turn = 5;
    game.player.maxMana = 5;
    game.player.mana = 3;
    game.enemy.maxMana = 5;
    game.enemy.mana = 5;
    game.player.life = 24;
    game.enemy.life = 19;
    const playerCards = ['golem', 'duri', 'puyuh', 'kaktus'];
    const enemyCards = ['ubur', 'akar', 'serigala'];
    playerCards.forEach((id) => {
      const def = findCard(id);
      const card = { ...def, uid: `demo-p-${id}`, attack: def.attack ?? 0, health: def.health ?? 0, maxHealth: def.health ?? 0, canAttack: true };
      if (def.type === 'creature') game.player.board.push(card);
      else game.player.hand.push(card);
    });
    enemyCards.forEach((id) => {
      const def = findCard(id);
      const card = { ...def, uid: `demo-e-${id}`, attack: def.attack ?? 0, health: def.health ?? 0, maxHealth: def.health ?? 0, canAttack: false };
      game.enemy.board.push(card);
    });
    while (game.player.hand.length < 5) drawCard(game, game.player);
    game.log.push('Raka memainkan Ubur Kilat (4/3).');
    game.log.push('Kamu memainkan Golem Bara (3/4).');
    game.log.push('Giliran 5 — manamu 3/5. Serang dengan makhlukmu!');
  } else if (demo === 'win') {
    game.enemy.life = 0;
    game.phase = 'won';
    game.winner = 'player';
    game.turn = 8;
    game.player.life = 11;
    game.log.push('Ember Terakhir: 7 damage ke Raka si Lawan!');
    game.log.push('Kamu menang! Raka si Lawan tumbang.');
  } else if (demo === 'loss') {
    game.player.life = 0;
    game.phase = 'lost';
    game.winner = 'enemy';
    game.turn = 9;
    game.enemy.life = 14;
    game.log.push('Naga Ember menyerangmu (6 damage).');
    game.log.push('Kamu kalah. Raka si Lawan menang.');
  }
  return true;
}

applyDemoHook();
refresh();
