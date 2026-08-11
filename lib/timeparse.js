'use strict';

// Parser condivisa per durate scritte in linguaggio naturale o abbreviato:
// supporta "5s", "10 minuti", "in 2 ore", "tra 3 giorni", "1h 30m", ecc.

const UNIT_PATTERN = [
    'secondi', 'secondo', 'second', 'seconds', 'sec',
    'minuti', 'minuto', 'minute', 'minutes', 'min',
    'ore', 'ora', 'hour', 'hours', 'hrs',
    'giorni', 'giorno', 'day', 'days',
    'anni', 'anno', 'year', 'years',
    'settimana', 'settimane', 'week', 'weeks',
    's', 'm', 'h', 'd',
];

// Ordina per lunghezza decrescente così "secondi" viene provato prima di "s".
const UNIT_RE = UNIT_PATTERN.sort((a, b) => b.length - a.length).join('|');
const MAX_MS = 30 * 24 * 60 * 60 * 1000; // 30 giorni (limite prudente)

const parseDuration = (text) => {
    const T = String(text || '');
    const re = new RegExp(`(?:\\b(?:in|tra|fra|entro|dopo|per)\\s+)?(\\d+(?:[.,]\\d+)?)\\s*(${UNIT_RE})\\b`, 'i');
    const m = T.match(re);
    if (!m) return null;

    const num = parseFloat(m[1].replace(',', '.'));
    const unit = m[2].toLowerCase();
    if (!Number.isFinite(num) || num <= 0) return null;

    let secs;
    if (/^(s|sec|secondi?|seconds?)$/.test(unit)) secs = num;
    else if (/^(m|min|minuti?|minutes?)$/.test(unit)) secs = num * 60;
    else if (/^(h|ore?|hours?|hrs)$/.test(unit)) secs = num * 3600;
    else if (/^(d|giorni?|days?)$/.test(unit)) secs = num * 86400;
    else if (/^(settimane?|weeks?)$/.test(unit)) secs = num * 7 * 86400;
    else if (/^(anni?|years?)$/.test(unit)) secs = num * 365 * 86400;
    else return null;

    const ms = Math.min(Math.round(secs) * 1000, MAX_MS);
    return { ms, num, unit, match: m[0] };
};

// Humanizza una durata in millisecondi (es. "2 ore e 5 minuti").
const humanizeMs = (ms) => {
    const totalSec = Math.max(1, Math.round(ms / 1000));
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts = [];
    if (d) parts.push(`${d} ${d === 1 ? 'giorno' : 'giorni'}`);
    if (h) parts.push(`${h} ${h === 1 ? 'ora' : 'ore'}`);
    if (m) parts.push(`${m} ${m === 1 ? 'minuto' : 'minuti'}`);
    if (s && !d && !h) parts.push(`${s} ${s === 1 ? 'secondo' : 'secondi'}`);
    return parts.join(' e ') || 'meno di un secondo';
};

// Formatta il residuo come "HH:MM:SS" o "MM:SS".
const formatCountdown = (ms) => {
    const totalSec = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

module.exports = { parseDuration, humanizeMs, formatCountdown, MAX_MS };