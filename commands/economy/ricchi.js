'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  RICCHI — Vex Bot
//  .ricchi → classifica dei 5 membri più ricchi del gruppo (tabella).
//  .ricchi <n> → mostra i primi n (max 20).
//  I gruppi esclusi con .escludi non mostrano la classifica.
// ─────────────────────────────────────────────────────────────────────────────

const { renderTable } = require('../../lib/table');

module.exports = {
    name: 'ricchi',
    aliases: ['topricchi', 'ricchi-top', 'classificaricchi'],
    description: "Classifica dei membri più ricchi del gruppo: .ricchi oppure .ricchi <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, reply, services } = context;
        const { db, dispOf, formatMoney } = services;

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
            .filter(([jid, data]) => jid.includes('@') && data && typeof data === 'object')
            .sort((a, b) => (b[1].money || 0) - (a[1].money || 0))
            .slice(0, limit);

        if (sorted.length === 0) return reply(
`📭 *NESSUNA RICCHEZZA*
━━━━━━━━━━━━━━━━━━
▸ Nessun dato disponibile.
▸ Lavora, gioca e vinci:
  la tua ricchezza verrà
  mostrata qui!
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);

        const rows = sorted.map(([jid, data], i) => [
            String(i + 1),
            '@' + dispOf(jid),
            (data.money || 0) > 0 ? formatMoney(data.money) : '0€',
        ]);

        const txt =
`💎 *TOP ${limit} RICCHI* 💎
${renderTable([
    { header: 'NO', align: 'r', max: 3 },
    { header: 'UTENTE', align: 'l', max: 18 },
    { header: 'SALDO', align: 'r', max: 14 },
], rows)}
▸ \`.ricchi 10\` per la classifica estesa.`;

        await sock.sendMessage(from, {
            text: txt,
            mentions: sorted.map(([jid]) => jid).slice(0, 10),
        }, { quoted: msg }).catch(() => reply(txt));
    },
};