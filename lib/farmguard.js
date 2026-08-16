'use strict';

/**
 * FarmGuard — Anti-spam "leggero" sui comandi di lavoro e gioco.
 *
 * Chi spamma i comandi monetari (work, scava, slot, giochi...) può farlo
 * liberamente FINO a MAX_OPS invocazioni nella finestra WINDOW; oltre il
 * limite scatta una pausa breve e fissa di BLOCK_MS (15 secondi).
 *
 * Comandi liberi (niente FarmGuard): cassaforte, taglia (spara), menu,
 * info e tutti i comandi non economici — gestito da index.js.
 */

const MAX_OPS  = 20;               // max operazioni monetarie prima della pausa
const WINDOW   = 60 * 1000;        // finestra di conteggio (1 minuto)
const BLOCK_MS = 15 * 1000;        // pausa di 15 secondi quando si supera il limite

// chatJid → { "from:sender" → { ts: [timestamps], blockedUntil: epochMs } }
const registry = new Map();

const check = (from, sender) => {
    const k = `${from}:${sender}`;
    let chat = registry.get(from);
    if (!chat) {
        chat = new Map();
        registry.set(from, chat);
    }
    const now = Date.now();

    let entry = chat.get(k) || { ts: [], blockedUntil: 0 };

    // Ancora in pausa → bloccato
    if (entry.blockedUntil > now) {
        chat.set(k, entry);
        return {
            blocked: true,
            retrySecs: Math.ceil((entry.blockedUntil - now) / 1000),
            count: entry.ts.length,
        };
    }

    // Pausa scaduta → contatore azzerato
    if (entry.blockedUntil) {
        entry.blockedUntil = 0;
        entry.ts = [];
    }

    // Rimuove timestamp fuori finestra
    entry.ts = entry.ts.filter(t => now - t < WINDOW);

    if (entry.ts.length >= MAX_OPS) {
        entry.blockedUntil = now + BLOCK_MS;
        chat.set(k, entry);
        return { blocked: true, retrySecs: BLOCK_MS / 1000, count: entry.ts.length };
    }

    entry.ts.push(now);
    chat.set(k, entry);
    return { blocked: false, count: entry.ts.length };
};

module.exports = { check, MAX_OPS, WINDOW, BLOCK_MS };