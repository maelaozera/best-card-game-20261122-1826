// Ember Duel — the table renderer.
// Turns the game state into DOM: the title screen, the table with both hands,
// both boards, both heroes with their life and mana, the battle log, and the
// win / loss screens. Cards slide and flip with CSS transitions; the renderer
// only adds classes and lets style.css do the moving.

import { ELEMENTS } from './cards.js';
import { MAX_MANA } from './game.js';

export function elementBadge(element) {
  const info = ELEMENTS[element];
  const badge = document.createElement('span');
  badge.className = 'element-badge';
  badge.style.background = info.color;
  badge.textContent = `${info.glyph} ${info.name}`;
  return badge;
}

export function createCardElement(card, options = {}) {
  const info = ELEMENTS[card.element];
  const el = document.createElement('div');
  el.className = `card element-${card.element}`;
  el.dataset.uid = card.uid;
  if (options.selected) el.classList.add('selected');
  if (options.playable) el.classList.add('playable');
  if (options.canAttack) el.classList.add('can-attack');
  if (options.targetable) el.classList.add('targetable');
  if (options.faceDown) {
    el.classList.add('face-down');
    el.innerHTML = '<div class="card-back"><span class="card-back-glyph">🔥</span><span class="card-back-text">EMBER<br>DUEL</span></div>';
    return el;
  }
  const stats = card.type === 'creature'
    ? `<span class="stat attack" title="Serangan">⚔ ${card.attack}</span><span class="stat health" title="Nyawa">♥ ${card.health}</span>`
    : '<span class="stat spell-tag">MANTRA</span>';
  el.innerHTML = `
    <div class="card-cost" title="Biaya mana">${card.cost}</div>
    <div class="card-glyph" style="color:${info.glow}">${info.glyph}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-element">${info.glyph} ${info.name}</div>
    <div class="card-text">${card.text}</div>
    <div class="card-stats">${stats}</div>`;
  return el;
}

export function createHeroElement(owner, options = {}) {
  const hero = document.createElement('div');
  hero.className = `hero ${options.isEnemy ? 'hero-enemy' : 'hero-player'}`;
  if (options.targetable) hero.classList.add('targetable');
  const manaPips = Array.from({ length: MAX_MANA }, (_, i) => {
    const filled = i < owner.mana;
    const unlocked = i < owner.maxMana;
    return `<span class="mana-pip ${filled ? 'filled' : ''} ${unlocked ? '' : 'locked'}">◆</span>`;
  }).join('');
  hero.innerHTML = `
    <div class="hero-avatar">${options.isEnemy ? '🔥' : '🛡'}</div>
    <div class="hero-info">
      <div class="hero-name">${owner.name}</div>
      <div class="hero-life" title="Nyawa">♥ ${owner.life} / 30</div>
      <div class="hero-life-bar"><div class="hero-life-fill" style="width:${(owner.life / 30) * 100}%"></div></div>
      <div class="hero-mana" title="Mana">${manaPips}</div>
      <div class="hero-deck">Deck: ${owner.deck.length} kartu</div>
    </div>`;
  return hero;
}

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function renderTable(game, ui, root) {
  const player = game.player;
  const enemy = game.enemy;
  root.innerHTML = '';
  root.className = 'table-screen';

  const topBar = document.createElement('div');
  topBar.className = 'top-bar';
  topBar.innerHTML = `
    <div class="game-title-mini">🔥 EMBER DUEL</div>
    <div class="turn-banner">${game.turnOwner === 'player' ? 'GILIRANMU — mainkan kartu, lalu akhiri giliran (E)' : 'Giliran Raka si Lawan…'}</div>
    <div class="score-line">Skor: Kamu ${player.life} ♥ &nbsp;•&nbsp; Raka ${enemy.life} ♥ &nbsp;•&nbsp; Giliran ${game.turn}</div>
    <button class="mute-button" type="button">🔊 Suara: Nyala</button>`;
  root.appendChild(topBar);

  const enemySide = document.createElement('div');
  enemySide.className = 'side side-enemy';
  const enemyHero = createHeroElement(enemy, { isEnemy: true, targetable: ui.selectedAttacker != null });
  enemyHero.addEventListener('click', () => ui.onHeroClick('enemy'));
  enemySide.appendChild(enemyHero);
  const enemyHand = document.createElement('div');
  enemyHand.className = 'hand hand-enemy';
  enemy.hand.forEach(() => enemyHand.appendChild(createCardElement({ uid: '', element: 'api' }, { faceDown: true })));
  enemySide.appendChild(enemyHand);
  const enemyBoard = document.createElement('div');
  enemyBoard.className = 'board board-enemy';
  enemy.board.forEach((creature) => {
    const cardEl = createCardElement(creature, { targetable: ui.selectedAttacker != null });
    cardEl.addEventListener('click', () => ui.onEnemyCreatureClick(creature.uid));
    enemyBoard.appendChild(cardEl);
  });
  if (enemy.board.length === 0) enemyBoard.innerHTML = '<div class="board-empty">Papan lawan masih kosong</div>';
  enemySide.appendChild(enemyBoard);
  root.appendChild(enemySide);

  const middle = document.createElement('div');
  middle.className = 'middle-row';
  middle.innerHTML = '<div class="vs-badge">⚔ VS ⚔</div>';
  const logBox = document.createElement('div');
  logBox.className = 'log-box';
  logBox.innerHTML = game.log.map((line) => `<div class="log-line">${line}</div>`).join('') || '<div class="log-line">Pertandingan dimulai.</div>';
  middle.appendChild(logBox);
  const endTurn = document.createElement('button');
  endTurn.className = 'end-turn-button';
  endTurn.type = 'button';
  endTurn.textContent = game.turnOwner === 'player' ? '⏎ Akhiri Giliran (E)' : 'Lawan sedang berpikir…';
  endTurn.disabled = game.turnOwner !== 'player';
  endTurn.addEventListener('click', () => ui.onEndTurn());
  middle.appendChild(endTurn);
  root.appendChild(middle);

  const playerSide = document.createElement('div');
  playerSide.className = 'side side-player';
  const playerBoard = document.createElement('div');
  playerBoard.className = 'board board-player';
  player.board.forEach((creature) => {
    const cardEl = createCardElement(creature, { canAttack: creature.canAttack && game.turnOwner === 'player' });
    cardEl.addEventListener('click', () => ui.onOwnCreatureClick(creature.uid));
    playerBoard.appendChild(cardEl);
  });
  if (player.board.length === 0) playerBoard.innerHTML = '<div class="board-empty">Mainkan makhluk dari tanganmu ke papan ini</div>';
  playerSide.appendChild(playerBoard);
  const playerHero = createHeroElement(player, {});
  playerSide.appendChild(playerHero);
  const playerHand = document.createElement('div');
  playerHand.className = 'hand hand-player';
  player.hand.forEach((card, index) => {
    const playable = game.turnOwner === 'player' && card.cost <= player.mana;
    const cardEl = createCardElement(card, {
      selected: ui.selectedCardUid === card.uid,
      playable,
    });
    cardEl.addEventListener('click', () => ui.onHandCardClick(card.uid));
    const keyHint = document.createElement('div');
    keyHint.className = 'key-hint';
    keyHint.textContent = `${index + 1}`;
    cardEl.appendChild(keyHint);
    playerHand.appendChild(cardEl);
  });
  playerSide.appendChild(playerHand);
  const hint = document.createElement('div');
  hint.className = 'controls-hint';
  hint.textContent = 'Klik kartu untuk memilih • Enter / Spasi: mainkan • 1-7: pilih kartu • Klik makhlukmu lalu klik target untuk menyerang • E: akhiri giliran • M: suara';
  playerSide.appendChild(hint);
  root.appendChild(playerSide);

  const muteButton = topBar.querySelector('.mute-button');
  muteButton.textContent = ui.muted ? '🔇 Suara: Mati' : '🔊 Suara: Nyala';
  muteButton.addEventListener('click', () => ui.onToggleMute());
}

export function renderTitle(root, onStart, onHowTo) {
  root.innerHTML = '';
  root.className = 'title-screen';
  root.innerHTML = `
    <div class="title-embers">🔥</div>
    <h1 class="title-heading">EMBER DUEL</h1>
    <p class="title-tagline">Duel kartu bara — empat elemen, satu pemenang.</p>
    <div class="title-elements">
      <span class="title-element" style="--el:#e8491d">▲ Api</span>
      <span class="title-element" style="--el:#1d7fe8">≈ Ombak</span>
      <span class="title-element" style="--el:#2fae4e">◆ Duri</span>
      <span class="title-element" style="--el:#8a4fd8">◎ Angin</span>
    </div>
    <p class="title-rules">Kamu dan Raka si Lawan punya 30 nyawa. Mana bertambah tiap giliran.<br>
    Mainkan makhluk, serang dengan mereka, dan lempar mantra sampai nyawa lawan habis.</p>
    <div class="title-buttons">
      <button class="title-button primary" type="button" id="start-button">▶ MULAI DUEL</button>
      <button class="title-button" type="button" id="howto-button">? CARA MAIN</button>
    </div>
    <p class="title-keys">Keyboard: 1-7 pilih kartu • Enter / Spasi mainkan • E akhiri giliran • M suara</p>
    <div class="title-howto" id="howto-box" hidden>
      <h2>Cara Main</h2>
      <ul>
        <li>Tiap giliran kamu dapat mana baru (maks 10) dan menarik 1 kartu.</li>
        <li>Klik kartu di tanganmu (atau tekan 1-7), lalu Enter / Spasi untuk memainkannya.</li>
        <li>Makhluk yang baru dimainkan belum bisa menyerang; giliran berikutnya baru bisa.</li>
        <li>Klik makhlukmu di papan, lalu klik makhluk lawan atau potret Raka untuk menyerang.</li>
        <li>Mantra langsung bekerja saat dimainkan: damage, pulih, atau tarik kartu.</li>
        <li>Siapa pun yang nyawanya habis lebih dulu kalah. Selamat berduel!</li>
      </ul>
    </div>`;
  root.querySelector('#start-button').addEventListener('click', onStart);
  root.querySelector('#howto-button').addEventListener('click', () => {
    const box = root.querySelector('#howto-box');
    box.hidden = !box.hidden;
    if (onHowTo) onHowTo();
  });
}

export function renderEndScreen(game, root, onRestart) {
  const won = game.phase === 'won';
  const drawn = game.winner === 'draw';
  root.innerHTML = '';
  root.className = won ? 'end-screen end-win' : 'end-screen end-loss';
  root.innerHTML = `
    <div class="end-emblem">${won ? '🏆' : drawn ? '🤝' : '💀'}</div>
    <h1 class="end-heading">${won ? 'KAMU MENANG!' : drawn ? 'SERI!' : 'KAMU KALAH'}</h1>
    <p class="end-sub">${won ? 'Raka si Lawan tumbang. Bara berpihak padamu!' : drawn ? 'Keduanya tumbang di saat yang sama — duel yang seimbang!' : 'Raka si Lawan menang kali ini. Bara masih menyala — coba lagi!'}</p>
    <div class="end-score">
      <div class="end-score-row"><span>Nyawamu</span><strong>${game.player.life} ♥</strong></div>
      <div class="end-score-row"><span>Nyawa Raka</span><strong>${game.enemy.life} ♥</strong></div>
      <div class="end-score-row"><span>Giliran dimainkan</span><strong>${game.turn}</strong></div>
      <div class="end-score-row"><span>Kartu tersisa di deck</span><strong>${game.player.deck.length}</strong></div>
    </div>
    <button class="title-button primary" type="button" id="restart-button">↻ MAIN LAGI</button>
    <p class="end-keys">Tekan Enter untuk main lagi</p>`;
  root.querySelector('#restart-button').addEventListener('click', onRestart);
}
