'use strict';

// ============================================================================
//  ANTIBOT "CACCIA BOT" — SOLO REAZIONE AI COMANDI
// ============================================================================
//  Quando un membro esegue un comando del bot (es. .menu), Vex arma
//  una finestra di osservazione. Dentro quella finestra, se UN ALTRO account
//  risponde con un output da bot (righe di separazione ━, header *MAIUSCOLO*,
//  quote del comando stesso, ecc.), l'account viene cacciato SUBITO.
//
//  Il criterio è volutamente stretto per NON cacciare gente a caso:
//  serve sempre una prova "strutturale" (non solo velocità di risposta).
// ============================================================================

// Finestra di osservazione dopo un comando (ms).
const WATCH_WINDOW_MS = 8000;

// Memoria in-process delle finestre armate: from -> { until, msgId, triggerBy }
const watchMem = new Map();

// Righe di separazione tipiche degli output dei bot (menu/aiuto/statistiche).
const BOT_BOX_LINE = /━{3,}|═{3,}|─{4,}|■{2,}/;

// Header stile bot: *TESTO IN MAIUSCOLO* all'inizio (anche dopo emoji).
const BOT_HEADER = /^\s*(?:[^\p{L}\p{N}])*\*\s*[A-ZÀ-ÝČĐĒ][A-ZÀ-ÝČĐĒ  ]{2,}\*/u;

// Arma la finestra di osservazione per una chat.
const arm = (from, { msgId, triggerBy }) => {
    watchMem.set(from, { until: Date.now() + WATCH_WINDOW_MS, msgId, triggerBy });
};

// True se per questa chat la finestra è ancora attiva.
const isArmed = (from, now = Date.now()) => {
    const w = watchMem.get(from);
    return !!w && now < w.until;
};

// Analizza un messaggio arrivato durante la finestra. Ritorna:
//   { hit: true, jid, reason } se l'account sembra un bot, oppure { hit: false }.
const scan = (from, { sender, quotedStanzaId, isCommand, isKnownCommand, body }) => {
    const w = watchMem.get(from);
    if (!w || Date.now() >= w.until) return { hit: false };

    // Mai sulla persona che ha lanciato il comando-scusa.
    if (sender === w.triggerBy) return { hit: false };

    // Prove strutturali che il messaggio è un output di bot.
    let evidence = 0;
    let reason = '';

    // Riga di separazione ━: quasi impossibile che la digiti un umano.
    if (BOT_BOX_LINE.test(body)) { evidence += 3; reason = 'righe separatori (output menu/aiuto)'; }
    if (BOT_HEADER.test(body)) { evidence += 2; reason = reason ? reason + ' + header bot' : 'header *MAIUSCOLO*'; }
    if (quotedStanzaId && quotedStanzaId === w.msgId) {
        evidence += 2; reason = reason ? reason + ' + quote del comando' : 'quote del comando';
    }
    // Un altro bot che "esegue" un proprio comando formattato.
    if (isCommand && isKnownCommand) { evidence += 1; }

    // Record del bot stesso e messaggi condivisi (@broadcast, notifiche).
    if (String(sender).includes('broadcast')) return { hit: false };

    // Soglia stretto: serve ALMENO una prova forte (separatori o quote).
    if (evidence >= 3) {
        return { hit: true, jid: sender, evidence, reason };
    }
    return { hit: false };
};

// Pulizia finestre scadute (chiamata raramente da chi usa l'API).
const prune = (now = Date.now()) => {
    for (const [k, w] of watchMem) {
        if (now >= w.until) watchMem.delete(k);
    }
};

module.exports = { WATCH_WINDOW_MS, arm, isArmed, scan, prune };