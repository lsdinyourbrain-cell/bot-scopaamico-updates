'use strict';

/**
 * premium.js — Gestione Premium/VIP per VEX Bot
 * Store: db._premium = { [normalizedKey]: { jid, addedBy, addedAt, expiry, days } }
 * normalizedKey = digits only (last 12) or lowercased jid if no digits
 */

const normalizeKey = (jid) => {
    if (!jid) return '';
    const s = String(jid).trim().toLowerCase().replace(/:\d+(?=@)/, '');
    const num = s.split('@')[0].replace(/[^0-9]/g, '');
    if (num.length >= 6) return num.slice(-12);
    return s;
};

const ensureStore = (db) => {
    if (!db._premium || typeof db._premium !== 'object') db._premium = {};
    return db._premium;
};

const isPremium = (db, jid) => {
    const store = ensureStore(db);
    const key = normalizeKey(jid);
    const entry = store[key];
    if (!entry) return false;
    if (!entry.expiry) return true;
    if (Date.now() > entry.expiry) {
        delete store[key];
        return false;
    }
    return true;
};

const getPremiumInfo = (db, jid) => {
    const store = ensureStore(db);
    const key = normalizeKey(jid);
    const entry = store[key];
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) {
        delete store[key];
        return null;
    }
    return entry;
};

const addPremium = (db, jid, days = 30, addedBy = null) => {
    const store = ensureStore(db);
    const key = normalizeKey(jid);
    const now = Date.now();
    const expiry = days > 0 ? now + days * 86400000 : null;
    store[key] = {
        jid: String(jid),
        normalized: key,
        addedBy,
        addedAt: now,
        expiry,
        days,
    };
    return store[key];
};

const removePremium = (db, jid) => {
    const store = ensureStore(db);
    const key = normalizeKey(jid);
    if (store[key]) {
        delete store[key];
        return true;
    }
    // fallback: try direct jid match
    for (const k of Object.keys(store)) {
        if (store[k].jid === jid) {
            delete store[k];
            return true;
        }
    }
    return false;
};

const listPremium = (db) => {
    const store = ensureStore(db);
    const now = Date.now();
    const out = [];
    for (const [k, v] of Object.entries(store)) {
        if (v.expiry && v.expiry < now) {
            delete store[k];
            continue;
        }
        out.push(v);
    }
    return out;
};

const formatRemaining = (expiry) => {
    if (!expiry) return '∞ permanente';
    const diff = expiry - Date.now();
    if (diff <= 0) return 'scaduto';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}g ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const premiumRequiredText = (sec, boxOpen, boxEnd, line) => {
    return `${sec('💎 PREMIUM RICHIESTO')}\n${boxOpen()}\n${line('✨ Questo comando è riservato agli utenti *Premium* 💎')}\n${line('')}\n${line('💫 Sblocca vantaggi esclusivi:')}\n${line('  ▸ 💰 Bonus giornalieri x3')}\n${line('  ▸ 🎮 Giochi premium & premi extra')}\n${line('  ▸ 🤖 AI illimitata & sticker VIP')}\n${line('  ▸ 🚀 Boost XP e priorità')}\n${line('')}\n${line('👑 Contatta un *Owner* per attivare il Premium!')}\n${line('💎 Usa *.premium* per info')}\n${boxEnd()}`;
};

module.exports = {
    normalizeKey,
    ensureStore,
    isPremium,
    getPremiumInfo,
    addPremium,
    removePremium,
    listPremium,
    formatRemaining,
    premiumRequiredText,
};
