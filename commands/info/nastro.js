'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  NASTRO — ScopaAmico Bot
//  Riepilogo del gruppo: totale bestemmie, utente più attivo, totale
//  messaggi, top XP e i soldi. Come la "carrellata di fine settimana" di
//  un gruppo di amici. Solo nei gruppi.
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';

const fmtMoney = (n) => Number(n || 0).toLocaleString('it-IT');

module.exports = {
    name: 'nastro',
    aliases: ['riepilogo', 'riassunto', 'statsgruppo', 'settimana'],
    description: "Riepilogo del gruppo: totale bestemmie, più attivo, messaggi e top XP. Uso: .nastro",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, isGroup, reply, services } = context;
        const { db, sendButtons } = services;

        if (!isGroup) return reply('📊 Disponibile solo nei gruppi.');

        const chat = db[from] || {};
        const users = Object.entries(chat)
            .filter(([jid, d]) => jid.includes('@') && d && typeof d === 'object');

        if (!users.length) {
            return sendButtons(sock, from,
`📊 *NASTRO*
${SEP}
Nessun dato per questo gruppo.
I contatori partono quando i
membri scrivono in chat.
${SEP}`,
                [{ label: '🏠 Menu', id: 'menu' }], msg);
        }

        let totalBestemmie = 0;
        let totalMsg = 0;
        let totalMoney = 0;
        let topMsg = null;
        let topXp = null;
        let topMoney = null;

        for (const [jid, d] of users) {
            const bestemmie = Number.isFinite(d.bestemmie) ? d.bestemmie : 0;
            const msgCount = Number.isFinite(d.msgCount) ? d.msgCount : 0;
            const money = Number.isFinite(d.money) ? d.money : 0;
            const xp = Number.isFinite(d.xp) ? d.xp : 0;
            totalBestemmie += bestemmie;
            totalMsg += msgCount;
            totalMoney += money;
            if (!topMsg || msgCount > topMsg.msgCount) topMsg = { jid, msgCount, name: d.name || jid.split('@')[0] };
            if (!topXp || xp > topXp.xp) topXp = { jid, xp, level: d.level || 1, name: d.name || jid.split('@')[0] };
            if (!topMoney || money > topMoney.money) topMoney = { jid, money, name: d.name || jid.split('@')[0] };
        }

        const medal = (i) => ['🥇', '🥈', '🥉', '🔹', '🔸'][i] || '🔹';
        const topXpList = users
            .sort((a, b) => (Number.isFinite(b[1].xp) ? b[1].xp : 0) - (Number.isFinite(a[1].xp) ? a[1].xp : 0))
            .slice(0, 5)
            .map(([jid, d], i) => `${medal(i)} @${jid.split('@')[0]} — liv. ${d.level || 1} · ${Number.isFinite(d.xp) ? d.xp : 0} XP`)
            .join('\n');

        const header = `📊 *NASTRO DEL GRUPPO*`;
        const txt =
`${header}
${SEP}
🤬 Bestemmie totali: *${fmtMoney(totalBestemmie)}*
💬 Messaggi totali: *${fmtMoney(totalMsg)}*
💰 Soldi in circolo: *${fmtMoney(totalMoney)}€*
${SEP}
⚡ *Più attivo*: @${topMsg.jid.split('@')[0]}
   (${topMsg.msgCount} messaggi)
🎮 *Top livelli*: @${topXp.jid.split('@')[0]}
   (liv. ${topXp.level} · ${topXp.xp} XP)
💵 *Più ricco*: @${topMoney.jid.split('@')[0]}
   (${fmtMoney(topMoney.money)}€)
${SEP}
🏆 *TOP 5 XP*
${topXpList}
${SEP}`;

        return sendButtons(sock, from, txt,
            [
                { label: '💪 Classifica attivi', id: 'top' },
                { label: '🏠 Menu', id: 'menu' },
            ], msg);
    },
};