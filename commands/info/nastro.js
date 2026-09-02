'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// 
//  NASTRO — Vex Bot
//  Riepilogo del gruppo: totale bestemmie, utente più attivo, totale
//  messaggi, top XP e i soldi. Come la "carrellata di fine settimana" di
//  un gruppo di amici. Solo nei gruppi.
// 

const SEP = '';

const fmtMoney = (n) => Number(n || 0).toLocaleString('it-IT');

module.exports = {
    name: 'nastro',
    aliases: ['riepilogo', 'riassunto', 'statsgruppo', 'settimana'],
    description: "Riepilogo del gruppo: totale bestemmie, più attivo, messaggi e top XP. Uso: .nastro",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, isGroup, reply, services } = context;
        const { db, dispOf, sendButtons, getCachedGroupMeta } = services;

        if (!isGroup) return reply('📊 Disponibile solo nei gruppi.');

        // Popola la mappa @lid→PN (usata da dispOf per mostrare i numeri veri
        // e dal resolver delle mentions per i tag) prima di costruire il testo.
        try { await getCachedGroupMeta(sock, from); } catch (_) {}

        const chat = db[from] || {};
        const users = Object.entries(chat)
            .filter(([jid, d]) => jid.includes('@') && d && typeof d === 'object');

        if (!users.length) {
            return sendButtons(sock, from,
`📊 *_NASTRO_*
${SEP}
▸ Nessun dato per questo gruppo.
▸ I contatori partono quando i
  membri scrivono in chat.
${SEP}
`,
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
            .map(([jid, d], i) => `${medal(i)} ▸ _@${dispOf(jid)}_ · liv. _${d.level || 1}_ · _${Number.isFinite(d.xp) ? d.xp : 0} XP_`)
            .join('\n');

        const header = `📊 *_NASTRO DEL GRUPPO_*`;
        const txt =
`${sec('HEADER')}\n${boxOpen()}\n${line(`${header}`)}\n${line(`${SEP}`)}\n${line(`🤬 Bestemmie totali: _${fmtMoney(totalBestemmie)}_`)}\n${line(`💬 Messaggi totali: _${fmtMoney(totalMsg)}_`)}\n${line(`💰 Soldi in circolo: _${fmtMoney(totalMoney)}€_`)}\n${line(`${SEP}`)}\n${line('⚡ *Più attivo*')}\n${line(`_@${dispOf(topMsg.jid)}_ · _${topMsg.msgCount} messaggi_`)}\n${line('🎮 *Top livelli*')}\n${line(`_@${dispOf(topXp.jid)}_ · _liv. ${topXp.level} · ${topXp.xp} XP_`)}\n${line('💵 *Più ricco*')}\n${line(`_@${dispOf(topMoney.jid)}_ · _${fmtMoney(topMoney.money)}€_`)}\n${line(`${SEP}`)}\n${line('🏆 *TOP 5 XP*')}\n${line(`${topXpList}`)}\n${line(`${SEP}`)}\n${boxEnd()}`;

        // Tagga chi compare nel nastro: mostra i PN reali (dispOf) e passa le
        // mentions risolte, così i tag evidenziano anche nei pulsanti nativi.
        const tagJids = [...new Set([
            topMsg.jid, topXp.jid, topMoney.jid,
            ...users.sort((a, b) => (Number.isFinite(b[1].xp) ? b[1].xp : 0) - (Number.isFinite(a[1].xp) ? a[1].xp : 0)).slice(0, 5).map(([jid]) => jid),
        ])];

        return sendButtons(sock, from, txt,
            [
                { label: '💪 Classifica attivi', id: 'top' },
                { label: '🏠 Menu', id: 'menu' },
            ], msg, tagJids);
    },
};