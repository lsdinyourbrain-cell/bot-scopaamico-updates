'use strict';

// Wordle: parole italiane e logica di controllo (verde/giallo/grigio).
// La partita vive in db[from].wordleGame e un handler in index.js processa
// i tentativi. Render della griglia come PNG via sharp.
// Le parole vengono pescate dall'archivio gigante (lib/words.js) e gli
// accenti vengono normalizzati in ingresso e nel confronto.

const { WORDLE_POOL, norm: normWord } = require('./words');

const WORD_LEN = 5;
const MAX_ATTEMPTS = 6;
const GAME_TIMEOUT_MS = 180000;

// Ingresso utente → forma normalizzata (MAIUSCOLO, 5 lettere, accenti base).
const normalizeGuess = (input) => normWord(input);

// Valuta un tentativo contro la parola da indovinare.
// Ritorna un array di 5 status: 'V' (verde), 'G' (giallo), 'X' (grigio).
// Gestisce correttamente le lettere ripetute.
const checkGuess = (target, guess) => {
    const t = normalizeGuess(target);
    const g = normalizeGuess(guess);
    const statuses = Array(WORD_LEN).fill('X');

    const remaining = {};
    for (let i = 0; i < WORD_LEN; i++) {
        if (g[i] === t[i]) {
            statuses[i] = 'V';
        } else {
            remaining[t[i]] = (remaining[t[i]] || 0) + 1;
        }
    }
    for (let i = 0; i < WORD_LEN; i++) {
        if (statuses[i] !== 'V' && (remaining[g[i]] || 0) > 0) {
            statuses[i] = 'G';
            remaining[g[i]]--;
        }
    }
    return statuses;
};

// Vera solo se il tentativo ha esattamente 5 lettere normalizzate.
const isWordValid = (word) => /^[A-Z]{5}$/.test(normalizeGuess(word));

// Sceglie una parola segreta di 5 lettere evitando quelle già usate.
// Ritorna { word, used } con `used` = elenco aggiornato da salvare.
const pickTarget = ({ exclude = [], random = Math.random } = {}) => {
    const fresh = WORDLE_POOL.filter((w) => !exclude.includes(normWord(w.word)));
    const candidates = fresh.length ? fresh : WORDLE_POOL;
    const entry = candidates[Math.floor(random() * candidates.length)];
    return { word: normWord(entry.word), used: [...exclude, normWord(entry.word)] };
};

// Rende la griglia 6x5 come PNG. `rows` è un array (max 6) di
// { word, statuses } con la lettera e lo status, oppure per le righe
// vuote può essere undefined/null.
const renderWordleGrid = async (sharp, rows, targetHint = null) => {
    const TILE = 96;
    const GAP = 10;
    const PAD = 24;
    const W = PAD * 2 + WORD_LEN * TILE + (WORD_LEN - 1) * GAP;
    const H = PAD * 2 + MAX_ATTEMPTS * TILE + (MAX_ATTEMPTS - 1) * GAP;

    const COLOR = { V: '#3aa158', G: '#cab458', X: '#3a3a3c' };

    let tiles = '';
    for (let r = 0; r < MAX_ATTEMPTS; r++) {
        const row = rows[r];
        for (let c = 0; c < WORD_LEN; c++) {
            const x = PAD + c * (TILE + GAP);
            const y = PAD + r * (TILE + GAP);
            let fill = '#1e1e24';
            let stroke = 'stroke="#3a3a44" stroke-width="3"';
            if (row && row.statuses) {
                const st = row.statuses[c];
                fill = COLOR[st] || '#1e1e24';
                stroke = '';
            }
            tiles += `<rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="12" fill="${fill}" ${stroke}/>`;
            if (row && row.word) {
                tiles += `<text x="${x + TILE / 2}" y="${y + TILE / 2 + 34}" font-family="Arial, sans-serif" font-size="56" fill="#ffffff" text-anchor="middle" font-weight="bold">${row.word[c]}</text>`;
            }
        }
    }

    let hint = '';
    if (targetHint) {
        hint = `<text x="${PAD}" y="${PAD + MAX_ATTEMPTS * (TILE + GAP) - GAP / 2}" font-family="Arial, sans-serif" font-size="26" fill="#ffd166" font-weight="bold">TARGET</text>`;
    }

    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#121216" rx="18"/>
        ${tiles}
        ${hint}
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
};

module.exports = {
    WORDLE_POOL, WORD_LEN, MAX_ATTEMPTS, GAME_TIMEOUT_MS,
    checkGuess,
    isWordValid,
    normalizeGuess,
    pickTarget,
    renderWordleGrid,
};