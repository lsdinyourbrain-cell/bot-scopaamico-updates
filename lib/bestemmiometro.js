'use strict';

const fs = require('fs');
const path = require('path');

let triggerWords = [];
let reactions = [];
let loaded = false;

const loadFiles = (dataDir) => {
    const wordsFile = path.join(dataDir, 'bestemmie_trigger.txt');
    const reactsFile = path.join(dataDir, 'bestemmiometro.txt');
    try {
        if (fs.existsSync(wordsFile)) {
            triggerWords = fs.readFileSync(wordsFile, 'utf-8').split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
        }
        if (fs.existsSync(reactsFile)) {
            reactions = fs.readFileSync(reactsFile, 'utf-8').split('\n').map(s => s.trim()).filter(Boolean);
        }
        loaded = true;
    } catch (e) {
        console.error('[BESTEMMIOMETRO] Errore caricamento file:', e.message);
    }
};

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Meno sensibile: "dio" da solo NON triggera, solo frasi esplicite.
// Richiede alm. 2 parole per i trigger brevi, così "dio" in "mio dio che caldo"
// non conta, ma "porco dio", "dio cane", ecc. sì.
const checkText = (text) => {
    if (!loaded || !triggerWords.length) return false;
    const lower = text.toLowerCase();
    return triggerWords.some(w => {
        const t = w.trim().toLowerCase();
        if (!t) return false;
        // Se è una singola parola corta (dio, cristo, gesù, madonna) richiedi contesto
        const isShortSingle = !t.includes(' ') && t.length <= 5;
        if (isShortSingle) {
            // Non triggerare su parola singola isolata; serve frase completa
            return false;
        }
        if (new RegExp('\\b' + escapeRe(t) + '\\b', 'i').test(lower)) return true;
        const joined = t.replace(/\s+/g, '');
        if (joined && joined !== t) {
            return new RegExp('\\b' + escapeRe(joined) + '\\b', 'i').test(lower);
        }
        return false;
    });
};

const getReaction = () => {
    if (!reactions.length) return '🤬 Ma che stai a di\'?';
    return reactions[Math.floor(Math.random() * reactions.length)];
};

module.exports = { loadFiles, checkText, getReaction };
