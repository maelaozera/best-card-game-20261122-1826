// Ember Duel — card catalogue.
// Four original elements, each told apart by colour AND shape, never by text alone:
//   Api   — red-orange flame triangle
//   Ombak — deep-blue wave
//   Duri  — leaf-green thorn diamond
//   Angin — violet wind swirl
// A card is either a creature (attack / health, stays on the table) or a spell
// (an instant effect, then gone). Every value the player needs is on the card:
// mana cost top-left, attack bottom-left, health bottom-right.

export const ELEMENTS = {
  api:   { name: 'Api',   color: '#e8491d', dark: '#8f1d05', glyph: '▲', glow: '#ff8a3d' },
  ombak: { name: 'Ombak', color: '#1d7fe8', dark: '#0a3d7a', glyph: '≈', glow: '#5db4ff' },
  duri:  { name: 'Duri',  color: '#2fae4e', dark: '#0f5c26', glyph: '◆', glow: '#7fe08a' },
  angin: { name: 'Angin', color: '#8a4fd8', dark: '#45207a', glyph: '◎', glow: '#c39bff' },
};

// Spell effects are small verbs the rules engine understands:
//   damageHero(n)   — deal n damage to the enemy hero
//   heal(n)         — restore n life to your own hero
//   draw(n)         — draw n cards from your deck
//   damageAll(n)    — deal n damage to every enemy creature, then n/2 (rounded down) to the hero
//   damageRandom(n) — deal n damage to a random enemy creature, or the hero if none
export const CARD_POOL = [
  { id: 'pijar',   name: 'Pijar Kecil',    element: 'api',   cost: 1, type: 'creature', attack: 1, health: 2, text: 'Percikan pertama.' },
  { id: 'keping',  name: 'Keping Ombak',   element: 'ombak', cost: 1, type: 'creature', attack: 2, health: 1, text: 'Setetes laut berani.' },
  { id: 'duri',    name: 'Duri Merayap',   element: 'duri',  cost: 2, type: 'creature', attack: 2, health: 3, text: 'Tumbuh di celah batu.' },
  { id: 'puyuh',   name: 'Angin Puyuh',    element: 'angin', cost: 2, type: 'creature', attack: 3, health: 2, text: 'Berputar lalu hilang.' },
  { id: 'golem',   name: 'Golem Bara',     element: 'api',   cost: 3, type: 'creature', attack: 3, health: 4, text: 'Batu yang tak padam.' },
  { id: 'ubur',    name: 'Ubur Kilat',     element: 'ombak', cost: 3, type: 'creature', attack: 4, health: 3, text: 'Sengat bagai kilat.' },
  { id: 'akar',    name: 'Penjaga Akar',   element: 'duri',  cost: 3, type: 'creature', attack: 2, health: 5, text: 'Akar tua penjaga.' },
  { id: 'serigala', name: 'Serigala Angin', element: 'angin', cost: 3, type: 'creature', attack: 4, health: 2, text: 'Secepat badai.' },
  { id: 'elang',   name: 'Elang Badai',    element: 'angin', cost: 4, type: 'creature', attack: 5, health: 4, text: 'Sayap pembawa guntur.' },
  { id: 'lumut',   name: 'Raksasa Lumut',  element: 'duri',  cost: 4, type: 'creature', attack: 4, health: 6, text: 'Gunung kecil berjalan.' },
  { id: 'duyung',  name: 'Putri Duyung',   element: 'ombak', cost: 4, type: 'creature', attack: 3, health: 5, text: 'Pulih 2 saat dimainkan.', effect: { kind: 'heal', amount: 2 } },
  { id: 'naga',    name: 'Naga Ember',     element: 'api',   cost: 5, type: 'creature', attack: 6, health: 5, text: 'Raja kecil dari bara.' },
  { id: 'levi',    name: 'Leviathan Biru', element: 'ombak', cost: 5, type: 'creature', attack: 5, health: 6, text: 'Laut itu bangkit.' },
  { id: 'phoenix', name: 'Phoenix Senja',  element: 'api',   cost: 6, type: 'creature', attack: 7, health: 6, text: 'Lahir dari abu.' },
  { id: 'kaktus',  name: 'Kaktus Perisai', element: 'duri',  cost: 2, type: 'creature', attack: 1, health: 4, text: 'Pulih 1 saat dimainkan.', effect: { kind: 'heal', amount: 1 } },
  { id: 'sembur',  name: 'Semburan Api',   element: 'api',   cost: 2, type: 'spell', text: 'Api menyambar lawan.', effect: { kind: 'damageHero', amount: 3 } },
  { id: 'hujan',   name: 'Hujan Penyembuh', element: 'ombak', cost: 2, type: 'spell', text: 'Pulihkan 5 nyawa.', effect: { kind: 'heal', amount: 5 } },
  { id: 'jerat',   name: 'Akar Menjerat',  element: 'duri',  cost: 1, type: 'spell', text: 'Cekik satu makhluk: 3.', effect: { kind: 'damageRandom', amount: 3 } },
  { id: 'tiupan',  name: 'Tiupan Segar',   element: 'angin', cost: 1, type: 'spell', text: 'Tarik 2 kartu baru.', effect: { kind: 'draw', amount: 2 } },
  { id: 'ledak',   name: 'Ledakan Bara',   element: 'api',   cost: 4, type: 'spell', text: 'Ledakan besar: 5.', effect: { kind: 'damageHero', amount: 5 } },
  { id: 'pasang',  name: 'Pasang Surut',   element: 'ombak', cost: 3, type: 'spell', text: 'Pulih 4, tarik 1 kartu.', effect: { kind: 'healDraw', amount: 4 } },
  { id: 'badai',   name: 'Badai Daun',     element: 'duri',  cost: 3, type: 'spell', text: 'Lukai semua makhluk.', effect: { kind: 'damageAll', amount: 2 } },
  { id: 'topan',   name: 'Topan Senja',    element: 'angin', cost: 5, type: 'spell', text: 'Pukul 4, tarik 1 kartu.', effect: { kind: 'damageDraw', amount: 4 } },
  { id: 'terakhir', name: 'Ember Terakhir', element: 'api',  cost: 6, type: 'spell', text: 'Bara terakhir: 7.', effect: { kind: 'damageHero', amount: 7 } },
];

// A 32-card deck: two copies of the cheap workhorses, one of the big finishers.
export const DECKLIST = [
  'pijar', 'pijar', 'keping', 'keping', 'duri', 'duri', 'puyuh', 'puyuh',
  'golem', 'ubur', 'akar', 'serigala', 'elang', 'lumut', 'duyung', 'naga',
  'levi', 'phoenix', 'kaktus', 'kaktus',
  'sembur', 'sembur', 'hujan', 'jerat', 'jerat', 'tiupan', 'tiupan',
  'ledak', 'pasang', 'badai', 'topan', 'terakhir',
];

export function findCard(id) {
  return CARD_POOL.find((card) => card.id === id);
}

export function buildDeck(random) {
  const ids = DECKLIST.slice();
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = ids[i];
    ids[i] = ids[j];
    ids[j] = tmp;
  }
  return ids.map((id) => makeCardInstance(findCard(id)));
}

let instanceCounter = 0;

export function makeCardInstance(definition) {
  instanceCounter += 1;
  return {
    uid: `c${instanceCounter}`,
    id: definition.id,
    name: definition.name,
    element: definition.element,
    cost: definition.cost,
    type: definition.type,
    attack: definition.attack ?? 0,
    health: definition.health ?? 0,
    maxHealth: definition.health ?? 0,
    text: definition.text,
    effect: definition.effect ?? null,
    canAttack: false,
  };
}
