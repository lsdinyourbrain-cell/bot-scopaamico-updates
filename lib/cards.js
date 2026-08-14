'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  CARTE COLLEZIONABILI — Vex Bot
//  Sistema "bustine" stile Pokémon:
//   - 3 set a tema Vex, ognuno con le sue carte e rarità;
//   - ogni busta (500€) contiene 5 carte: 3 comuni + 1 non comune/ra + 1 slot
//     "stella" che può essere rara, epica o leggendaria;
//   - possibilità di "shiny" (✦, 5% a carta): bordo dorato e duplicato da 2x;
//   - le carte duplicano → rimborso automatico in € (stelline).
//  L'immagine di ogni carta è generata come SVG → PNG con sharp.
// ─────────────────────────────────────────────────────────────────────────────

// Rarità: più è alta la weight, più è facile pescarla.
const RARITIES = [
    { key: 'comune',      emoji: '⚪', label: 'Comune',      color: '#b9c2cb', weight: 55, refund: 5 },
    { key: 'noncomune',   emoji: '🟢', label: 'Non Comune',  color: '#2ecc71', weight: 30, refund: 12 },
    { key: 'rara',        emoji: '🔵', label: 'Rara',        color: '#5dade2', weight: 12, refund: 30 },
    { key: 'epica',       emoji: '🟣', label: 'Epica',       color: '#af7ac5', weight: 4,  refund: 70 },
    { key: 'leggendaria', emoji: '🟡', label: 'Leggendaria', color: '#f4d03f', weight: 1.2, refund: 200 },
];
const RARITY = Object.fromEntries(RARITIES.map(r => [r.key, r]));

// ── SETS ────────────────────────────────────────────────────────────────────
// Ogni carta: id univoco nel set, nome, emoji (l'arte), rarità.
const SETS = [
    {
        key: 'PUL', name: 'Era dei Pulsanti', emoji: '🔘', color: '#5dade2',
        cards: [
            { id: 'PUL-001', name: 'Pulsante Contaclick', emoji: '🔘', rarity: 'comune' },
            { id: 'PUL-002', name: 'Messaggio Fantasma', emoji: '👻', rarity: 'comune' },
            { id: 'PUL-003', name: 'Ping Eterno', emoji: '📡', rarity: 'comune' },
            { id: 'PUL-004', name: 'Sticker Sgualcito', emoji: '🎨', rarity: 'comune' },
            { id: 'PUL-005', name: 'Emoji Assassina', emoji: '😂', rarity: 'comune' },
            { id: 'PUL-006', name: 'Autista del Gruppo', emoji: '🚌', rarity: 'comune' },
            { id: 'PUL-007', name: 'Bot Admin', emoji: '⚙️', rarity: 'noncomune' },
            { id: 'PUL-008', name: 'Antilink Attivo', emoji: '🔗', rarity: 'noncomune' },
            { id: 'PUL-009', name: 'Bestemmiatore Serial', emoji: '🤬', rarity: 'noncomune' },
            { id: 'PUL-010', name: 'Memer del Gruppo', emoji: '🧌', rarity: 'noncomune' },
            { id: 'PUL-011', name: 'ScopaBot Junior', emoji: '🤖', rarity: 'rara' },
            { id: 'PUL-012', name: 'Re Sasso', emoji: '🪨', rarity: 'rara' },
            { id: 'PUL-013', name: 'Lady Memoria', emoji: '🧠', rarity: 'rara' },
            { id: 'PUL-014', name: 'Incursore Notturno', emoji: '🌙', rarity: 'rara' },
            { id: 'PUL-015', name: 'Bot Supremo', emoji: '👑', rarity: 'epica' },
            { id: 'PUL-016', name: 'Modalità DedSecregna', emoji: '💀', rarity: 'epica' },
            { id: 'PUL-017', name: 'Vex Bot Legend', emoji: '🌟', rarity: 'leggendaria' },
        ],
    },
    {
        key: 'BES', name: 'Guardiani della Bestemmia', emoji: '📿', color: '#e74c3c',
        cards: [
            { id: 'BES-001', name: 'Bestemmia Contata', emoji: '📿', rarity: 'comune' },
            { id: 'BES-002', name: 'Minuto di Raccoglimento', emoji: '⏳', rarity: 'comune' },
            { id: 'BES-003', name: 'Vocale Ubriaco', emoji: '🥴', rarity: 'comune' },
            { id: 'BES-004', name: 'Tastiera Rovente', emoji: '⌨️', rarity: 'comune' },
            { id: 'BES-005', name: 'Patrono dei Tag', emoji: '🏷️', rarity: 'comune' },
            { id: 'BES-006', name: 'Il Pentimento', emoji: '😇', rarity: 'noncomune' },
            { id: 'BES-007', name: 'Chierichetto del Gruppo', emoji: '🕯️', rarity: 'noncomune' },
            { id: 'BES-008', name: 'Censore Veloce', emoji: '✂️', rarity: 'noncomune' },
            { id: 'BES-009', name: 'Cucina della Nonna', emoji: '🍝', rarity: 'noncomune' },
            { id: 'BES-010', name: 'Guardiano dei Portali', emoji: '🚪', rarity: 'rara' },
            { id: 'BES-011', name: 'Barista Zen', emoji: '🍺', rarity: 'rara' },
            { id: 'BES-012', name: 'Il Predicatore', emoji: '🤲', rarity: 'rara' },
            { id: 'BES-013', name: 'Santa Madre del Meme', emoji: '🖼️', rarity: 'epica' },
            { id: 'BES-014', name: "L'Esausto", emoji: '🙏', rarity: 'epica' },
            { id: 'BES-015', name: 'Papà Bestemmia', emoji: '🔥', rarity: 'leggendaria' },
        ],
    },
    {
        key: 'SER', name: 'Serata Epica', emoji: '🎩', color: '#f39c12',
        cards: [
            { id: 'SER-001', name: 'Dado Bugiardo', emoji: '🎲', rarity: 'comune' },
            { id: 'SER-002', name: 'Coppa Vuota', emoji: '🍻', rarity: 'comune' },
            { id: 'SER-003', name: 'Puntata Audace', emoji: '💸', rarity: 'comune' },
            { id: 'SER-004', name: 'Sedia Scricchiolante', emoji: '🪑', rarity: 'comune' },
            { id: 'SER-005', name: 'Telefono Spento', emoji: '📵', rarity: 'comune' },
            { id: 'SER-006', name: 'Il Debole di Cuore', emoji: '💓', rarity: 'noncomune' },
            { id: 'SER-007', name: 'Roulette Impazzita', emoji: '🔴', rarity: 'noncomune' },
            { id: 'SER-008', name: 'Asso nella Manica', emoji: '🃏', rarity: 'noncomune' },
            { id: 'SER-009', name: 'Vecchio del Duello', emoji: '⚔️', rarity: 'noncomune' },
            { id: 'SER-010', name: 'Spada di Cartone', emoji: '🗡️', rarity: 'rara' },
            { id: 'SER-011', name: 'Carrozzone del Casinò', emoji: '🎰', rarity: 'rara' },
            { id: 'SER-012', name: 'Ladro di Sconti', emoji: '🦹', rarity: 'rara' },
            { id: 'SER-013', name: 'Magnate del Gruppo', emoji: '🏦', rarity: 'epica' },
            { id: 'SER-014', name: 'Il Grande Bluff', emoji: '🤥', rarity: 'epica' },
            { id: 'SER-015', name: 'Barone della Serata', emoji: '🎩', rarity: 'leggendaria' },
        ],
    },
];

const SET_BY_KEY = Object.fromEntries(SETS.map(s => [s.key, s]));
const TOTAL_CARDS = SETS.reduce((n, s) => n + s.cards.length, 0);

// ── REGOLE BUSTA ────────────────────────────────────────────────────────────
const PACK_COST = 500;       // prezzo di una busta
const SHINY_CHANCE = 0.05;   // 5% di shiny per carta
const PACK_SLOTS = [
    () => 'comune',
    () => 'comune',
    () => 'comune',
    () => pickRarity(['noncomune', 'rara']),
    () => pickRarity(['rara', 'epica', 'leggendaria']),
];

// Sceglie una rarità tra le chiavi date, pesata sulla weight di ognuna.
function pickRarity(keys) {
    const pool = keys.map(k => RARITY[k]);
    const total = pool.reduce((s, r) => s + r.weight, 0);
    let r = Math.random() * total;
    for (const it of pool) {
        r -= it.weight;
        if (r <= 0) return it.key;
    }
    return pool[pool.length - 1].key;
}

// Sceglie un set a caso e una carta della rarità richiesta dentro quel set.
function pickCard(rarityKey) {
    const set = SETS[Math.floor(Math.random() * SETS.length)];
    const pool = set.cards.filter(c => c.rarity === rarityKey);
    const card = pool[Math.floor(Math.random() * pool.length)] || set.cards[0];
    return { set, card };
}

// Apre una busta: 5 carte secondo gli slot della busta.
const openPack = () => PACK_SLOTS.map(slotFn => {
    const rarityKey = slotFn();
    const { set, card } = pickCard(rarityKey);
    return {
        set,
        card,
        rarity: RARITY[card.rarity],
        shiny: Math.random() < SHINY_CHANCE,
    };
});

// Rimborso in € di un duplicato (lo shiny raddoppia).
const dupeRefund = (pull) => {
    const base = RARITY[pull.card.rarity]?.refund || 5;
    return pull.shiny ? base * 2 : base;
};

// ── COLLEZIONE UTENTE ──────────────────────────────────────────────────────
// uDB.cards: { 'PUL:001': { count, dupes, shiny, ts } }
const initUserCards = (u) => {
    if (!u.cards || typeof u.cards !== 'object') u.cards = {};
    u.cardsOpened = Number.isFinite(u.cardsOpened) ? u.cardsOpened : 0;
    u.cardsDupes = Number.isFinite(u.cardsDupes) ? u.cardsDupes : 0;
    return u;
};

const cardKeyOf = (pull) => `${pull.set.key}:${pull.card.id}`;

// Aggiunge una carta pescata alla collezione. Ritorna { isNew, entry, refund }.
const addCard = (u, pull) => {
    initUserCards(u);
    const key = cardKeyOf(pull);
    const entry = u.cards[key];
    if (entry) {
        entry.dupes = (entry.dupes || 0) + 1;
        entry.shiny = Boolean(entry.shiny) || Boolean(pull.shiny);
        u.cardsDupes += 1;
        return { isNew: false, entry, refund: dupeRefund(pull) };
    }
    u.cards[key] = { count: 1, dupes: 0, shiny: Boolean(pull.shiny), ts: Date.now() };
    return { isNew: true, entry: u.cards[key] };
};

// Statistiche collezione di un utente.
const collectionStats = (u) => {
    initUserCards(u);
    const entries = Object.entries(u.cards);
    const owned = entries.length;
    const dupes = entries.reduce((s, [, c]) => s + (c.dupes || 0), 0);
    const bySet = {};
    for (const [key, entry] of entries) {
        const setKey = key.split(':')[0];
        bySet[setKey] = (bySet[setKey] || 0) + 1;
    }
    return { owned, dupes, bySet, opened: u.cardsOpened, total: TOTAL_CARDS };
};

// Ordina le carte possedute: shiny prima, poi per rarità (dalla più alta).
const sortOwned = (u) => {
    initUserCards(u);
    const order = { leggendaria: 0, epica: 1, rara: 2, noncomune: 3, comune: 4 };
    return Object.entries(u.cards)
        .map(([key, entry]) => {
            const [setKey, id] = key.split(':');
            const set = SET_BY_KEY[setKey];
            const card = set?.cards.find(c => c.id === id) || null;
            return { set, card, entry, key };
        })
        .filter(x => x.set && x.card)
        .sort((a, b) => {
            if (a.entry.shiny !== b.entry.shiny) return a.entry.shiny ? -1 : 1;
            const diff = order[a.card.rarity] - order[b.card.rarity];
            if (diff !== 0) return diff;
            return String(a.card.name).localeCompare(String(b.card.name));
        });
};

// ── RENDER CARD (SVG → PNG) ────────────────────────────────────────────────
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CARD_W = 360;
const CARD_H = 500;

const cardSvg = ({ set, card, entry }) => {
    const r = RARITY[card.rarity];
    const shiny = Boolean(entry?.shiny);
    const border = shiny ? '#ffd700' : r.color;

    // Raggi dorati dietro l'emoji per le card shiny.
    const rays = shiny
        ? Array.from({ length: 12 }, (_, i) => {
            const ang = (i * 30) * Math.PI / 180;
            const x1 = CARD_W / 2 + Math.cos(ang) * 55;
            const y1 = 235 + Math.sin(ang) * 55;
            const x2 = CARD_W / 2 + Math.cos(ang) * 130;
            const y2 = 235 + Math.sin(ang) * 130;
            return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#ffd700" stroke-width="10" opacity="0.25" stroke-linecap="round"/>`;
        }).join('')
        : '';

    return `<svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b1b2f"/>
      <stop offset="1" stop-color="#0d0d17"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${border}"/>
      <stop offset="1" stop-color="${border}" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="${CARD_W - 16}" height="${CARD_H - 16}" rx="22" fill="url(#bg)" stroke="${border}" stroke-width="7"/>
  <rect x="16" y="16" width="${CARD_W - 32}" height="46" rx="10" fill="url(#band)"/>
  <text x="${CARD_W / 2}" y="49" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">${esc(set.emoji)} ${esc(set.name)}</text>
  <text x="26" y="82" font-family="Arial, sans-serif" font-size="16" fill="${border}" font-weight="bold">${esc(card.id)}</text>
  ${shiny ? `<text x="${CARD_W - 26}" y="82" font-family="Arial, sans-serif" font-size="16" fill="#ffd700" font-weight="bold" text-anchor="end">✦ SHINY</text>` : ''}
  ${rays}
  <text x="${CARD_W / 2}" y="285" font-family="Arial, sans-serif" font-size="150" text-anchor="middle">${esc(card.emoji)}</text>
  <rect x="${CARD_W / 2 - 105}" y="322" width="210" height="36" rx="18" fill="${r.color}" opacity="0.22"/>
  <text x="${CARD_W / 2}" y="346" font-family="Arial, sans-serif" font-size="19" fill="${r.color}" font-weight="bold" text-anchor="middle">${r.emoji} ${r.label.toUpperCase()}</text>
  <text x="${CARD_W / 2}" y="408" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">${esc(card.name)}</text>
  <text x="${CARD_W / 2}" y="440" font-family="Arial, sans-serif" font-size="15" fill="#9aa0a6" text-anchor="middle">${esc(set.name)}</text>
  <rect x="16" y="${CARD_H - 66}" width="${CARD_W - 32}" height="40" rx="10" fill="#15152a"/>
  <text x="${CARD_W / 2}" y="${CARD_H - 39}" font-family="Arial, sans-serif" font-size="14" fill="#c8c8e0" text-anchor="middle">SCOPAMICO · ${esc(set.key)} · ${entry ? 'POSSIEDITA' : ''}</text>
</svg>`;
};

const renderCard = async (sharp, { set, card, entry }) => {
    const svg = cardSvg({ set, card, entry });
    return sharp(Buffer.from(svg)).png().toBuffer();
};

// Busta (l'involucro) renderizzata come immagine.
const packSvg = () => `<svg width="${360}" height="${500}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pk" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7b2ff7"/>
      <stop offset="1" stop-color="#2b0a5e"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="344" height="484" rx="20" fill="url(#pk)"/>
  <rect x="18" y="18" width="324" height="464" rx="14" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.5"/>
  <rect x="18" y="60" width="324" height="44" rx="10" fill="#ffffff" opacity="0.12"/>
  <text x="180" y="93" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">SCOPAMICO BUSTA</text>
  <text x="180" y="245" font-family="Arial, sans-serif" font-size="170" text-anchor="middle">🎁</text>
  <text x="180" y="360" font-family="Arial, sans-serif" font-size="20" fill="#d9c8ff" text-anchor="middle">5 carte per busta</text>
  <text x="180" y="395" font-family="Arial, sans-serif" font-size="16" fill="#b59be8" text-anchor="middle">raccogli tutte e ${TOTAL_CARDS} le carte!</text>
  <rect x="90" y="430" width="180" height="38" rx="19" fill="#ffd700"/>
  <text x="180" y="456" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#2b0a5e" text-anchor="middle">★ 500 € ★</text>
</svg>`;

const renderPack = async (sharp) => sharp(Buffer.from(packSvg())).png().toBuffer();

module.exports = {
    RARITIES,
    RARITY,
    SETS,
    SET_BY_KEY,
    TOTAL_CARDS,
    PACK_COST,
    SHINY_CHANCE,
    openPack,
    dupeRefund,
    initUserCards,
    cardKeyOf,
    addCard,
    collectionStats,
    sortOwned,
    cardSvg,
    renderCard,
    packSvg,
    renderPack,
    pickRarity,
};
