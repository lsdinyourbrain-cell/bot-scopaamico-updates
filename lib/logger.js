'use strict';

const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const BOT_LOG = path.join(LOG_DIR, 'bot.log');
const MAX_LINES = 8000; // rotazione: si tengono le ultime 8000 righe

const safeStringify = (o) => {
    try { return JSON.stringify(o); } catch (_) { return String(o); }
};

const ensureDir = () => {
    try {
        if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch (_) {}
};

let initialized = false;

// Inizializza il logger: patch di console.* per scrivere anche su file.
const init = () => {
    if (initialized) return;
    initialized = true;
    ensureDir();

    // Rotazione del file di log (mantiene solo le ultime MAX_LINES righe)
    try {
        if (fs.existsSync(BOT_LOG)) {
            const content = fs.readFileSync(BOT_LOG, 'utf-8');
            const lines = content.split('\n');
            if (lines.length > MAX_LINES) {
                fs.writeFileSync(BOT_LOG, lines.slice(-MAX_LINES).join('\n'));
            }
        }
    } catch (_) {}

    const append = (level, args) => {
        try {
            ensureDir();
            const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
            const line = `[${ts}] [${level.toUpperCase().padEnd(5)}] ${args
                .map(a => typeof a === 'string' ? a : safeStringify(a))
                .join(' ')}\n`;
            fs.appendFileSync(BOT_LOG, line);
        } catch (_) {}
    };

    const levels = ['log', 'info', 'warn', 'error', 'debug'];
    for (const lv of levels) {
        const orig = (console[lv] || console.log).bind(console);
        console[lv] = (...args) => {
            try { orig(...args); } catch (_) {}
            append(lv, args);
        };
    }
};

// Sink Writable da passare a pino (logger di Baileys): scrive in bot.log
// le righe di log di Baileys in forma leggibile.
const makeBaileysSink = () => new Writable({
    write(chunk, _enc, cb) {
        try {
            const raw = chunk.toString().trim();
            if (!raw) { cb(); return; }
            let parsed;
            try { parsed = JSON.parse(raw); } catch (_) { cb(); return; }
            if (parsed) {
                const lv = parsed.level === 50 ? 'error' : parsed.level === 40 ? 'warn' : parsed.level === 30 ? 'info' : 'debug';
                const time = parsed.time ? new Date(parsed.time).toISOString().replace('T', ' ').slice(0, 19) : new Date().toISOString().replace('T', ' ').slice(0, 19);
                const msg = parsed.msg || '';
                const line = `[${time}] [BAIL-${lv.toUpperCase()}] ${msg}\n`;
                ensureDir();
                fs.appendFileSync(BOT_LOG, line);
            }
        } catch (_) {}
        cb();
    },
});

// Legge le ultime n righe del log del bot.
const getBotLog = (n = 80) => {
    try {
        if (!fs.existsSync(BOT_LOG)) return 'Nessun log disponibile.';
        const lines = fs.readFileSync(BOT_LOG, 'utf-8').split('\n').filter(l => l.trim());
        return lines.slice(-n).join('\n');
    } catch (e) {
        return 'Errore lettura log: ' + e.message;
    }
};

module.exports = { init, getBotLog, makeBaileysSink, BOT_LOG };
