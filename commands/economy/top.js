'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOP — Vex Bot
//  .top → classifica dei 5 membri più attivi del gruppo (tabella).
//  .top <n> → mostra i primi n (max 20).
//  I gruppi esclusi con .escludi non mostrano la classifica.
// ─────────────────────────────────────────────────────────────────────────────

const { renderTable } = require('../../lib/table');

module.exports = {
    name: 'top',
    aliases: ['topattivi', 'attivi', 'classifica'],
    description: "Classifica dei membri più attivi del gruppo: .top oppure .top <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, reply, services } = context;
        const { db, dispOf } = services;

        if (!isGroup) return reply("❌ Comando disponibile solo nei gruppi.");
        if (db._escludi?.[from]) {
            return reply(
`🚫 *CLASSIFICA DISATTIVATA*
━━━━━━━━━━━━━━━━━━
▸ Questo gruppo è escluso dalle
  classifiche (con .escludi).
▸ Un admin può riammetterlo con
  \`.escludi off\`.
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);
        }

        const want = parseInt(String(textArgs || '').trim(), 10);
        const limit = Number.isInteger(want) && want > 0 ? Math.min(want, 20) : 5;

        const chatUsers = db[from] || {};
        const sorted = Object.entries(chatUsers)
            .filter(([jid, data]) => jid.includes('@') && data && typeof data === 'object' && (data.msgCount || 0) > 0)
            .sort((a, b) => (b[1].msgCount || 0) - (a[1].msgCount || 0))
            .slice(0, limit);

        if (sorted.length === 0) return reply(
`📭 *NESSUNA ATTIVITÀ*
━━━━━━━━━━━━━━━━━━
▸ Nessun dato disponibile.
▸ Scrivi in chat e torna qui:
  la tua attività verrà contata!
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);

        const rows = sorted.map(([jid, data], i) => [
            String(i + 1),
            '@' + dispOf(jid),
            String(data.msgCount || 0),
        ]);

        const txt =
`🏆 *TOP ${limit} ATTIVI* 🏆
${renderTable([
    { header: 'NO', align: 'r', max: 3 },
    { header: 'UTENTE', align: 'l', max: 18 },
    { header: 'MSG', align: 'r', max: 7 },
], rows)}
▸ \`.top 10\` per la classifica estesa.`;

        await sock.sendMessage(from, {
            text: txt,
            mentions: sorted.map(([jid]) => jid).slice(0, 10),
        }, { quoted: msg }).catch(() => reply(txt));
    },
};