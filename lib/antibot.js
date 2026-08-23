'use strict';

// ============================================================================
//  ANTIBOT — DETECTION PURAMENTE STRUTTURALE (no foto profilo, no VoIP)
// ============================================================================
//  Finestra di osservazione armata dopo ogni comando del bot. Dentro la
//  finestra, ogni messaggio di un *altro* sender viene valutato con un
//  punteggio evidence basato solo su artefatti da bot (pulsanti, box, header).
//  Soglia hit >= 4. Veloce, senza I/O, senza fetchGroupMetadata.
// ============================================================================

const WATCH_WINDOW_MS = 10000;

// Memoria in-process delle finestre armate: from (groupJid) -> { until, msgId, triggerBy }
const watchMem = new Map();

// Evidenze strutturali
const BOT_BOX_LINE = /━{3,}|═|─{4,}|■{2,}/;
const BOT_HEADER = /^\s*[^\p{L}\p{N}]*\* [A-Z ]{3,}\*/u;

// Tracking sender -> timestamps (per high-rate) e conteggio pulsanti
const senderTimestamps = new Map(); // senderJid -> number[]
const senderButtonCount = new Map(); // senderJid -> number
const hits = []; // { ts, from, sender, evidence, reason, body }
const MAX_HITS = 20;
const HIGH_RATE_WINDOW_MS = 5000;
const HIGH_RATE_THRESHOLD = 3; // >3 in 5s
const THRESHOLD = 4;

// Arma la finestra di osservazione per una chat.
const arm = (from, { msgId, triggerBy }) => {
    watchMem.set(from, { until: Date.now() + WATCH_WINDOW_MS, msgId, triggerBy });
};

// True se per questa chat la finestra è ancora attiva.
const isArmed = (from, now = Date.now()) => {
    const w = watchMem.get(from);
    return !!w && now < w.until;
};

// Analizza un messaggio arrivato durante la finestra.
// opts: { sender, body, isCommand, messageType, hasButtons, hasInteractive, hasList, isHighRate }
const scan = (from, { sender, body, isCommand, messageType, hasButtons, hasInteractive, hasList, isHighRate } = {}) => {
    const w = watchMem.get(from);
    const now = Date.now();
    if (!w || now >= w.until) return { hit: false };
    if (!sender) return { hit: false };
    if (sender === w.triggerBy) return { hit: false };
    if (String(sender).includes('broadcast')) return { hit: false };

    // --- tracking high-rate (Map sender -> timestamps) ---
    let arr = senderTimestamps.get(sender);
    if (!arr) arr = [];
    arr.push(now);
    // tieni solo ultimi 5s
    const cutoff = now - HIGH_RATE_WINDOW_MS;
    let writeIdx = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] >= cutoff) arr[writeIdx++] = arr[i];
    }
    arr.length = writeIdx;
    senderTimestamps.set(sender, arr);
    const computedHighRate = arr.length > HIGH_RATE_THRESHOLD;
    const effectiveHighRate = Boolean(isHighRate) || computedHighRate;

    // --- tracking messaggi con pulsanti ---
    if (hasButtons || hasInteractive || hasList) {
        senderButtonCount.set(sender, (senderButtonCount.get(sender) || 0) + 1);
    }

    let evidence = 0;
    const reasons = [];

    if (hasButtons) { evidence += 5; reasons.push('pulsanti (buttonsMessage)'); }
    if (hasInteractive) { evidence += 5; reasons.push('interattivo (interactive)'); }
    if (hasList) { evidence += 4; reasons.push('lista (listMessage)'); }

    const b = body || '';
    if (BOT_BOX_LINE.test(b)) { evidence += 3; reasons.push('righe separatori (box)'); }
    if (BOT_HEADER.test(b)) { evidence += 2; reasons.push('header *MAIUSCOLO*'); }
    if (effectiveHighRate) { evidence += 2; reasons.push('high-rate (>3/5s)'); }
    if (isCommand) { evidence += 1; reasons.push('comando (.)'); }

    const reason = reasons.join(' + ');

    if (evidence >= THRESHOLD) {
        const entry = { ts: now, from, sender, evidence, reason, body: String(b).slice(0, 120) };
        hits.push(entry);
        if (hits.length > MAX_HITS) hits.splice(0, hits.length - MAX_HITS);
        return { hit: true, jid: sender, evidence, reason, isHighRate: effectiveHighRate, hasButtons: !!hasButtons, hasInteractive: !!hasInteractive, hasList: !!hasList, messageType: messageType || null };
    }
    return { hit: false, evidence, reason, isHighRate: effectiveHighRate };
};

// Statistiche per il comando .antibot
const getStats = () => {
    const now = Date.now();
    let armed = 0;
    for (const w of watchMem.values()) if (now < w.until) armed++;
    const recentHits = [...hits].reverse().slice(0, 5);
    return {
        windowMs: WATCH_WINDOW_MS,
        threshold: THRESHOLD,
        armedGroups: armed,
        totalGroups: watchMem.size,
        totalSenders: senderTimestamps.size,
        hits: recentHits,
        recentHits,
        allHits: [...hits],
        buttonStats: Object.fromEntries(senderButtonCount),
        senderTimestamps: Object.fromEntries([...senderTimestamps.entries()].map(([k, v]) => [k, v.length])),
        watchMem: [...watchMem.entries()].map(([k, v]) => ({ from: k, until: v.until, triggerBy: v.triggerBy, remainingMs: Math.max(0, v.until - now) })),
    };
};

// Reset completo (per test o comando)
const clear = () => {
    watchMem.clear();
    senderTimestamps.clear();
    senderButtonCount.clear();
    hits.length = 0;
};

// Pulizia finestre scadute + pruning timestamps vecchi
const prune = (now = Date.now()) => {
    for (const [k, w] of watchMem) {
        if (now >= w.until) watchMem.delete(k);
    }
    const cutoff = now - HIGH_RATE_WINDOW_MS;
    for (const [k, arr] of senderTimestamps) {
        let writeIdx = 0;
        for (let i = 0; i < arr.length; i++) if (arr[i] >= cutoff) arr[writeIdx++] = arr[i];
        arr.length = writeIdx;
        if (arr.length === 0) senderTimestamps.delete(k);
        else senderTimestamps.set(k, arr);
    }
};

module.exports = { WATCH_WINDOW_MS, BOT_BOX_LINE, BOT_HEADER, THRESHOLD, arm, isArmed, scan, getStats, clear, prune };
