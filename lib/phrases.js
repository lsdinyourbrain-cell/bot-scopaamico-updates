'use strict';

const fs = require('fs');
const path = require('path');

const PHRASES_DIR = path.join(__dirname, '..', 'phrases');

function ensureDir() {
    if (!fs.existsSync(PHRASES_DIR)) fs.mkdirSync(PHRASES_DIR, { recursive: true });
}

function fileFor(key) {
    // sanitizza: solo a-z0-9_- 
    const safe = String(key || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return path.join(PHRASES_DIR, `${safe}.txt`);
}

// Legge le frasi da phrases/<key>.txt — una per riga, ignora righe vuote e commenti #
function getPhrases(key) {
    try {
        const f = fileFor(key);
        if (!fs.existsSync(f)) return null;
        const raw = fs.readFileSync(f, 'utf-8');
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length && !l.startsWith('#'));
        return lines.length ? lines : null;
    } catch (_) { return null; }
}

function getPhrasesOrDefault(key, fallback) {
    const fromFile = getPhrases(key);
    return fromFile || fallback || [];
}

function savePhrases(key, phrases) {
    ensureDir();
    const f = fileFor(key);
    const content = (phrases || []).join('\n') + '\n';
    fs.writeFileSync(f, content, 'utf-8');
    return phrases;
}

function addPhrase(key, phrase) {
    const existing = getPhrases(key) || [];
    const clean = String(phrase || '').trim();
    if (!clean) return existing;
    existing.push(clean);
    savePhrases(key, existing);
    return existing;
}

function removePhrase(key, index) {
    const existing = getPhrases(key);
    if (!existing) return null;
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= existing.length) return null;
    existing.splice(idx, 1);
    savePhrases(key, existing);
    return existing;
}

function listKeys() {
    ensureDir();
    try {
        return fs.readdirSync(PHRASES_DIR)
            .filter(f => f.endsWith('.txt'))
            .map(f => f.replace(/\.txt$/, ''))
            .sort();
    } catch (_) { return []; }
}

function exists(key) {
    return fs.existsSync(fileFor(key));
}

// Per power: gestisce anche chiavi con livello (es. scopa_1, scopa_2)
function getPowerPhrases(cmd, level) {
    const key = `${cmd}_${level}`;
    return getPhrases(key);
}

module.exports = {
    PHRASES_DIR,
    fileFor,
    getPhrases,
    getPhrasesOrDefault,
    savePhrases,
    addPhrase,
    removePhrase,
    listKeys,
    exists,
    getPowerPhrases,
    ensureDir,
};
