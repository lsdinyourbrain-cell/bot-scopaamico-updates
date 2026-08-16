'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  XP / LIVELLI — Vex Bot
//  L'utente accumula XP con la sua attività NEL GRUPPO (ogni messaggio vale
//  XP_PER_MSG). A ogni salita di livello riceve un "pregio" (badge divertente,
//  niente a che vedere con warn/ban) e un piccolo bonus economico. Lo stato è
//  per-gruppo perché vive dentro l'utente di getUser(jid, chatId).
//  Nessuna dipendenza esterna: usato da index.js (assegnazione) e .profilo.
// ─────────────────────────────────────────────────────────────────────────────

const XP_PER_MSG = 4;
const MAX_LEVEL = 999;

// XP necessaria per passare dal livello `level` al successivo. Curva
// super-lineare: i primi livelli restano facili (~25 messaggi), poi serve
// sempre di più (scalare diventa dura). Formula: 100 × level^1.4.
//   lvl 1→2 : ~100 XP  (~25 msg)
//   lvl 5→6 : ~933 XP  (~233 msg)
//   lvl 10→11: ~2512 XP (~628 msg)
//   lvl 20→21: ~6614 XP (~1653 msg)
const xpForNext = (level) => Math.max(100, Math.round(100 * Math.pow(Math.max(1, level), 1.4)));

// Pregi (titoli prestigiosi) assegnati a ogni livello. Oltre la lista si usa
// il fallback generico con il numero di livello.
const XP_RANKS = [
    '🌱 Novellino',
    '💬 Chiacchierone',
    '🔥 Fuoco di chat',
    '⭐ Stellina del posto',
    '💎 Pietra preziosa',
    '🌟 Leggenda locale',
    '🚀 Missile sociale',
    '👑 Re/Regina del gruppo',
    '🧠 Mente del gruppo',
    '🦁 Leone da tastiera',
];

const rankOf = (level) =>
    (Number.isInteger(level) && level >= 1 && level <= XP_RANKS.length)
        ? XP_RANKS[level - 1]
        : `👾 Oltre l'umano (${level})`;

// Barra XP testuale di progresso (10 blocchi), per la grafica del profilo.
const xpBar = (cur, need, size = 10) => {
    const n = Math.max(0, Math.min(1, (cur || 0) / (need || 1)));
    const filled = Math.round(n * size);
    return '█'.repeat(filled) + '░'.repeat(Math.max(0, size - filled));
};

// Applica XP a un utente e fa salire i livelli Necessari. Ritorna l'elenco dei
// nuovi livelli raggiunti (vuoto = nessun level-up). Aggiunge i pregi e
// riallinea l'XP residuo. NOTA: il bonus economico lo accredita il chiamante.
const grantXp = (user, messages = 1) => {
    const userXp = Number.isFinite(user.xp) ? user.xp : 0;
    user.xp = userXp + XP_PER_MSG * Math.max(1, messages);

    const ups = [];
    let level = Number.isFinite(user.level) && user.level >= 1 ? user.level : 1;
    let need = xpForNext(level);
    while (user.xp >= need && level < MAX_LEVEL) {
        user.xp -= need;
        level++;
        ups.push(level);
        need = xpForNext(level);
    }
    if (ups.length) {
        user.level = level;
        if (!Array.isArray(user.pregi)) user.pregi = [];
        for (const lv of ups) user.pregi.push({ rank: rankOf(lv), lv, ts: Date.now() });
        if (user.pregi.length > 12) user.pregi = user.pregi.slice(-12);
    }
    return ups;
};

// Messaggio "carino" inviato in chat quando l'utente sale di livello.
const levelUpText = (ups, senderNum) => {
    const last = Math.max(...ups);
    const bonus = 10 + last * 5;
    const salita = ups.length > 1 ? `di ${ups.length} livelli,\nfino al livello` : 'al livello';
    return `🎉 *LEVEL UP!* 🎉\n━━━━━━━━━━━━━━━━━━\n@${senderNum} è salito\n${salita} *${last}*!\n🏅 Pregio: *${rankOf(last)}*\n💰 Bonus: +${bonus}€\n━━━━━━━━━━━━━━━━━━\nContinua così, sei forza! 🌟`;
};

module.exports = { XP_PER_MSG, MAX_LEVEL, xpForNext, XP_RANKS, rankOf, xpBar, grantXp, levelUpText };