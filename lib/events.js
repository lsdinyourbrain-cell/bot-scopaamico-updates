'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  EVENTI — Vex Bot
//  Eventi temporanei per chat, attivati con .evento (owner/admin).
//  Stato in db._events[chatId][tipo] = { until, startedAt } — persiste nel db.
//  Tipi:
//    doppioxp       → XP doppi per tutti (index.js)
//    doppioguadagno → work/scava/daily/lavoro2 pagano x2
//    slotoro        → vincite giochi d'azzardo x3
//    tagliaregale   → taglie più grosse e frequenti
//    boss           → boss di gruppo da abbattere (.evento boss)
//    pioggia        → ogni tanto piovono soldi in chat (.evento raccogli)
//    cassa          → ricompensa oraria (.evento apri)
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_TYPES = {
    doppioxp:       { emoji: '💠', label: 'Doppio XP',        defaultMin: 120, desc: 'Tutti guadagnano 2x XP' },
    doppioguadagno: { emoji: '💰', label: 'Doppio guadagno',  defaultMin: 120, desc: 'work/scava/daily pagano il doppio' },
    slotoro:        { emoji: '🎰', label: "Slot d'oro",       defaultMin: 60,  desc: 'Vincite dei giochi x3' },
    tagliaregale:   { emoji: '🏆', label: 'Taglia regale',    defaultMin: 120, desc: 'Taglie più grosse e frequenti' },
    boss:           { emoji: '💥', label: 'Boss di gruppo',   defaultMin: 30,  desc: 'Un boss gigante da abbattere (.evento boss)' },
    pioggia:        { emoji: '🌧️', label: 'Pioggia di soldi', defaultMin: 60,  desc: 'Ogni tanto piovono soldi (.evento raccogli)' },
    cassa:          { emoji: '🎁', label: 'Cassa misteriosa', defaultMin: 60,  desc: 'Ricompensa oraria (.evento apri)' },
};

const MIN_MS = 60 * 1000;

const isActive = (db, chatId, type) => {
    try {
        const ev = db?._events?.[chatId]?.[type];
        return Boolean(ev && ev.until > Date.now());
    } catch (_) { return false; }
};

const start = (db, chatId, type, minutes) => {
    const meta = EVENT_TYPES[type];
    if (!meta) return { ok: false };
    if (!db._events) db._events = {};
    if (!db._events[chatId]) db._events[chatId] = {};
    const dur = Math.min(1440, Math.max(5, minutes || meta.defaultMin));
    db._events[chatId][type] = { until: Date.now() + dur * MIN_MS, startedAt: Date.now() };
    return { ok: true, dur, meta };
};

const stop = (db, chatId, type) => {
    if (db._events?.[chatId]?.[type]) {
        delete db._events[chatId][type];
        return true;
    }
    return false;
};

const remainingMin = (db, chatId, type) => {
    const ev = db?._events?.[chatId]?.[type];
    if (!ev) return 0;
    return Math.max(0, Math.ceil((ev.until - Date.now()) / MIN_MS));
};

const activeList = (db, chatId) =>
    Object.keys(EVENT_TYPES).filter(t => isActive(db, chatId, t));

// ── BOSS ────────────────────────────────────────────────────────────────────
const spawnBoss = (db, chatId) => {
    if (!db._boss) db._boss = {};
    const maxHp = 2000 + Math.floor(Math.random() * 3000);
    db._boss[chatId] = { hp: maxHp, maxHp, ts: Date.now(), shots: {} };
    return db._boss[chatId];
};

const BOSS_CD_MS = 10 * 1000;

const bossShot = (db, chatId, sender) => {
    const boss = db?._boss?.[chatId];
    if (!boss) return { error: 'noboss' };
    const now = Date.now();
    if (boss.shots[sender] && now - boss.shots[sender] < BOSS_CD_MS) {
        return { error: 'cd', remain: Math.ceil((BOSS_CD_MS - (now - boss.shots[sender])) / 1000) };
    }
    boss.shots[sender] = now;
    const dmg = 100 + Math.floor(Math.random() * 300);
    boss.hp -= dmg;
    if (boss.hp <= 0) {
        const reward = boss.maxHp * 2;
        delete db._boss[chatId];
        stop(db, chatId, 'boss');
        return { killed: true, dmg, reward, maxHp: boss.maxHp };
    }
    return { dmg, hp: boss.hp, maxHp: boss.maxHp };
};

// ── PIOGGIA ─────────────────────────────────────────────────────────────────
const startRain = (db, chatId) => {
    if (!db._rain) db._rain = {};
    if (db._rain[chatId]) return null;
    const amount = 30 + Math.floor(Math.random() * 120);
    db._rain[chatId] = { amount, ts: Date.now() };
    return db._rain[chatId];
};

const takeRain = (db, chatId) => {
    const rain = db?._rain?.[chatId];
    if (!rain) return null;
    delete db._rain[chatId];
    return rain;
};

// ── CASSA ───────────────────────────────────────────────────────────────────
const CASSA_CD_MS = 60 * MIN_MS;

const openCassa = (db, chatId, sender) => {
    if (!isActive(db, chatId, 'cassa')) return { error: 'off' };
    if (!db._cassa) db._cassa = {};
    if (!db._cassa[chatId]) db._cassa[chatId] = {};
    const last = db._cassa[chatId][sender] || 0;
    if (Date.now() - last < CASSA_CD_MS) {
        return { error: 'cd', remain: Math.ceil((CASSA_CD_MS - (Date.now() - last)) / MIN_MS) };
    }
    db._cassa[chatId][sender] = Date.now();
    const money = 100 + Math.floor(Math.random() * 300);
    const badge = Math.random() < 0.25;
    return { money, badge };
};

module.exports = {
    EVENT_TYPES, isActive, start, stop, remainingMin, activeList,
    spawnBoss, bossShot, startRain, takeRain, openCassa,
};