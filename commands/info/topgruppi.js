'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOPGRUPPI — Vex Bot
//  .topgruppi → classifica dei gruppi più attivi in LISTA NATIVA di WhatsApp
//  (pannello a righe del pulsante nativo, niente tabella ASCII). Premendo una
//  riga arriva `.topgruppi info <n>` con i dettagli del gruppo.
//  I gruppi esclusi con .escludi non compaiono.
// ─────────────────────────────────────────────────────────────────────────────

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

        // Nomi dei gruppi (con cache) per il pannello nativo e per le info.
        const names = new Map();
        for (const [gid] of list) {
            try {
                const meta = await getCachedGroupMeta(sock, gid);
                names.set(gid, meta?.subject ? String(meta.subject).slice(0, 25) : gid.split('@')[0]);
            } catch (_) { names.set(gid, gid.split('@')[0]); }
        }

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
            const name = names.get(gid) || gid.split('@')[0];
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

        // La classifica VIVE nel pannello nativo: il corpo del messaggio è
        // solo il titolo, le righe le apre il pulsante a lista di WhatsApp.
        const txt =
`🏆 *TOP GRUPPI* 🏆

📲 Premi *📊* qui sotto e scegli
un gruppo per vederne i dettagli.`;

        // Righe del pannello nativo (max 20): i gruppi + riga per aggiornare.
        const listRows = list.map(([gid, data], i) => ({
            header: `#${i + 1}`,
            title: names.get(gid) || gid.split('@')[0],
            description: `${data.n || 0} messaggi`,
            id: `topgruppi info ${i + 1}`,
        }));
        listRows.push({
            header: '⟳',
            title: '🔄 Aggiorna classifica',
            description: ' ',
            id: 'topgruppi',
        });

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