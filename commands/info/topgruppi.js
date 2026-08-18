'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOPGRUPPI — Vex Bot
//  .topgruppi → classifica dei gruppi più attivi (con nome, messaggi e
//  utenti attivi). I gruppi esclusi con .escludi non compaiono.
// ─────────────────────────────────────────────────────────────────────────────

const { renderTable } = require('../../lib/table');

module.exports = {
    name: 'topgruppi',
    aliases: ['topgroup', 'topchat', 'classificagruppi', 'topgruppiactivi'],
    description: "Classifica dei gruppi più attivi del bot: messaggi, utenti attivi e nome del gruppo.",

    async run(sock, msg, args, context) {
        const { from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, sendButtons, getCachedGroupMeta } = services;

        const att = db._gruppiAttivita || {};
        const esclusi = db._escludi || {};
        const list = Object.entries(att)
            .filter(([gid]) => gid.endsWith('@g.us') && !esclusi[gid])
            .sort((a, b) => (b[1].n || 0) - (a[1].n || 0))
            .slice(0, 10);

        if (!list.length) {
            return reply(
`🏆 *TOP GRUPPI* 🏆
━━━━━━━━━━━━━━━━━━
▸ Nessun dato ancora.
▸ Scrivi e gioca nei gruppi:
  l'attività viene contata e
  questi gruppi saliranno in
  classifica.
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);
        }

        const rows = [];
        for (let i = 0; i < list.length; i++) {
            const [gid, data] = list[i];
            let name = gid.split('@')[0];
            try {
                const meta = await getCachedGroupMeta(sock, gid);
                if (meta?.subject) name = String(meta.subject).slice(0, 25);
            } catch (_) {}
            rows.push([String(i + 1), name, String(data.n || 0)]);
        }

        const txt =
`🏆 *TOP GRUPPI* 🏆
${renderTable([
    { header: 'NO', align: 'r', max: 3 },
    { header: 'GRUPPO', align: 'l', max: 25 },
    { header: 'MSG', align: 'r', max: 7 },
], rows)}
▸ Il nome è quello attuale del gruppo.
▸ Per togliere un gruppo dalla
  classifica: \`.escludi\` (admin).`;

        const btns = [];
        if (isGroup && (isOwner || isSenderAdmin)) {
            btns.push({ label: '🚫 Escludi questo gruppo', id: 'escludi' });
        }
        btns.push({ label: '🔄 Aggiorna', id: 'topgruppi' });

        try {
            await sendButtons(sock, from, txt, btns, msg);
        } catch (_) {
            await reply(txt);
        }
    },
};