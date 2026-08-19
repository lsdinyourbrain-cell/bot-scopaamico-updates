'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOPGRUPPI — Vex Bot
//  .topgruppi → classifica dei gruppi più attivi del bot. Pulsante *📊 Vedi
//  tabella* → VERA TABELLA in immagine (niente sezioni nate da pannelli
//  nativi). *📊 Scegli un gruppo* → dettagli del gruppo. I gruppi esclusi
//  con .escludi non compaiono.
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';
const { renderLeaderboardImage } = require('../../lib/leaderboard');

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

        // ── TABELLA IN IMMAGINE ───────────────────────────────────────────
        // `.topgruppi tabella` (o il pulsante 📊) → VERA tabella PNG, non una
        // sezione nativa. Nessun tag qui: i gruppi non sono utenti.
        if (String(args[0] || '').toLowerCase() === 'tabella') {
            const rows = list.map(([gid, data]) => ({
                name: names.get(gid) || gid.split('@')[0],
                value: `${data.n || 0} msg`,
            }));
            let png;
            try {
                png = await renderLeaderboardImage({
                    title: 'TOP GRUPPI',
                    subtitle: 'Gruppi più attivi del bot',
                    accent: '#34d399',
                    accent2: '#0ea5e9',
                    rows,
                });
            } catch (e) {
                console.error('[topgruppi] render tabella:', e.message);
                return reply('⚠️ Errore generando la tabella, riprova.');
            }
            const [wGid, wData] = list[0];
            await sock.sendMessage(from, {
                image: png,
                mimetype: 'image/png',
                caption:
`🏆 *TOP GRUPPI* 🏆
${SEP}
🥇 *${names.get(wGid) || wGid.split('@')[0]}*
  è il gruppo più attivo
  con *${wData.n || 0}* messaggi!
${SEP}
◈ _Vex Bot_`,
            }, { quoted: msg });
            return;
        }

        // Corpo del messaggio: titolo + hint.
        const txt =
`🏆 *TOP GRUPPI* 🏆
${SEP}
📲 Premi *📊* per la tabella
completa o per i dettagli
di un gruppo.`;

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
            { label: '📊 Vedi tabella', id: 'topgruppi tabella' },
            { type: 'single_select', label: '🔍 Scegli un gruppo', title: '🏆 Top gruppi', sectionTitle: 'Classifica', rows: listRows },
        ];
        if (isGroup && (isOwner || isSenderAdmin)) {
            btns.push({ label: '🚫 Escludi questo gruppo', id: 'escludi' });
        } else {
            btns.push({ label: '🔄 Aggiorna', id: 'topgruppi' });
        }

        await sendButtons(sock, from, txt, btns, msg);
    },
};