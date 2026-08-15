'use strict';

/**
 * FarmGuard — Anti-spam "fatturazione".
 *
 * Limita il numero di operazioni che modificano i soldi
 * (work, daily, scava, slot, lavoro2, streak, roulette, blackjack, ...)
 * a MASSIMO MAX_OPS ogni WINDOW_MS per ogni utente.
 *
 * Una volta superato il limite, il comando è bloccato con un messaggio
 * di attesa finché la finestra non si è ripiena.
 */

const MAX_OPS  = 3;                // max operazioni monetarie
const WINDOW   = 10 * 60 * 1000;   // 10 minuti

// chatJid → { jid → [timestamps...] }
const registry = new Map();

const key = (from, sender) => `${from}:${sender}`;

const check = (from, sender) => {
    const k = key(from, sender);
    let chat = registry.get(from);
    if (!chat) {
        chat = new Map();
        registry.set(from, chat);
    }
    const now = Date.now();

    let arr = chat.get(k) || [];
    // rimuove timestamp fuori finestra
    arr = arr.filter(t => now - t < WINDOW);
    if (arr.length >= MAX_OPS) {
        // tempo mancante alla scadenza della finestra più vecchia
        const eta = Math.ceil((WINDOW - (now - arr[0])) / 60000);
        chat.set(k, arr);
        return { blocked: true, retryMins: eta, count: arr.length };
    }

    arr.push(now);
    chat.set(k, arr);
    return { blocked: false, count: arr.length };
};

module.exports = { check, MAX_OPS, WINDOW };
