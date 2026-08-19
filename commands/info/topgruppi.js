'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOPGRUPPI — Vex Bot
//  .topgruppi → classifica dei gruppi più attivi (con nome, messaggi e
//  utenti attivi) in tabella nativa con pulsante a lista. I gruppi esclusi
//  con .escludi non compaiono.
// ─────────────────────────────────────────────────────────────────────────────

const { renderTable } = require('../../lib/table');

const SEP = '━━━━━━━━━━━━━━━━━━';

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
${SEP}
▸ Nessun dato ancora.
▸ Scrivi e gioca nei gruppi:
  l'attività viene contata e
  questi gruppi saliranno in
  classifica.
${SEP}
◈ _Vex Bot_`);
        }

        // ── INFO GRUPPO (dalla lista nativa) ──────────────────────────────
        // Quando si preme una voce della lista, arriva `.topgruppi info <n>`.
        if (String(args[0] || '').toLowerCase() === 'info') {
            const idx = parseInt(args[1], 10);
            const entry = list[idx - 1];
            if (!entry) return reply('⚠️ Indice non valido: la classifica è cambiata, riprova.');
            const [gid, data] = entry;
            let name = gid.split('@')[0];
            try {
                const meta = await getCachedGroupMeta(sock, gid);
                if (meta?.subject) name = String(meta.subject).slice(0, 25);
            } catch (_) {}
            const utenti = Object.keys(db[gid] || {})
                .filter(k => k.includes('@') && db[gid][k] && typeof db[gid][k] === 'object' && (db[gid][k].msgCount || 0) > 0).length;
            return reply(
`🏆 *INFO GRUPPO*
${SEP}
▸ 📛 ${name}
▸ 💬 Messaggi: *${data.n || 0}*
▸ 👥 Utenti attivi: *${utenti}*
${SEP}
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
▸ Premi *📊* e scegli un gruppo
  per vederne i dettagli.`;

        const listRows = list.map(([gid, data], i) => ({
            header: `#${i + 1}`,
            title: String(rows[i][1]),
            description: `${data.n || 0} messaggi`,
            id: `topgruppi info ${i + 1}`,
        }));

        const btns = [
            { type: 'single_select', label: '📊 Scegli un gruppo', title: '🏆 Top gruppi', sectionTitle: 'Classifica', rows: listRows },
        ];
        if (isGroup && (isOwner || isSenderAdmin)) {
            btns.push({ label: '🚫 Escludi questo gruppo', id: 'escludi' });
        }
        btns.push({ label: '🔄 Aggiorna', id: 'topgruppi' });

        await sendButtons(sock, from, txt, btns, msg);
    },
};