'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOPGRUPPI — Vex Bot · v2 Premium
//  .topgruppi → classifica gruppi: ENTRAMBI immagine PNG + pulsanti
//  Tabella vera con POS | GRUPPO | MESSAGGI | MEMBRI
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━━━';
const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';
const { renderLeaderboardImage } = require('../../lib/leaderboard');

const toBold = (s) => '*' + String(s||'').trim() + '*';
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

        const names = new Map();
        const membersCount = new Map();
        await Promise.all(list.map(async ([gid]) => {
            try {
                const meta = await getCachedGroupMeta(sock, gid);
                names.set(gid, meta?.subject ? String(meta.subject).slice(0, 24) : gid.split('@')[0]);
                const partCount = Array.isArray(meta?.participants) ? meta.participants.length : 0;
                membersCount.set(gid, partCount);
            } catch (_) {
                names.set(gid, gid.split('@')[0]);
                const dbCount = Object.keys(db[gid]||{}).filter(k=>k.includes('@') && db[gid][k]?.msgCount).length;
                membersCount.set(gid, dbCount);
            }
        }));

        if (!list.length) {
            return reply(
`🏆  ${toBold('TOP GRUPPI')}
${SEP}
▸ Nessun dato ancora.
▸ Scrivi e gioca nei gruppi:
  l'attività verrà contata.
${SEP}
◈ Vex Bot`);
        }

        if (String(args[0] || '').toLowerCase() === 'info') {
            const idx = parseInt(args[1], 10);
            const entry = list[idx - 1];
            if (!entry) return reply('⚠️ Indice non valido: classifica cambiata, riprova.');
            const [gid, data] = entry;
            const name = names.get(gid) || gid.split('@')[0];
            const utenti = membersCount.get(gid) ?? Object.keys(db[gid]||{}).filter(k=>k.includes('@') && db[gid][k]?.msgCount).length;
            const txt =
`${toBold('INFO GRUPPO')}  ·  #${idx}
${SEP}
📛  ${name}
💬  Messaggi: ${toBold(String(data.n||0))}
👥  Membri: ${toBold(String(utenti))}
🆔  ${gid.split('@')[0]}
${SEP}
◈ Vex Bot`;
            await sock.sendMessage(from, { text: txt }, { quoted: msg });
            const btns = [
                { label: '📊 Tabella', id: 'topgruppi' },
                { label: '🏠 Menu', id: 'menu' },
            ];
            await sendButtons(sock, from, `${toBold('AZIONI')} — ${name}`, btns, msg, null, { headerTitle: '🏆 Info Gruppo', footerText: '⬇️ Torna alla top' });
            return;
        }

        // Tabella immagine con 4 colonne
        const rowsImg = list.map(([gid, data]) => ({
            name: names.get(gid) || gid.split('@')[0],
            msg: `${data.n||0} msg`,
            members: `${membersCount.get(gid)||0}`,
        }));

        let png;
        try {
            png = await renderLeaderboardImage({
                title: 'TOP GRUPPI',
                subtitle: 'Gruppi più attivi del bot',
                accent: '#34d399',
                accent2: '#0ea5e9',
                rows: rowsImg,
            });
        } catch (e) {
            console.error('[topgruppi] render:', e.message);
            return reply('⚠️ Errore tabella, riprova.');
        }

        const [wGid, wData] = list[0];
        const wName = names.get(wGid) || wGid.split('@')[0];

        await sock.sendMessage(from, {
            image: png,
            mimetype: 'image/png',
            caption:
`🏆  ${toBold('TOP GRUPPI')}  🏆
${SEP}
🥇  ${toBold(wName)}
   ${wData.n||0} messaggi  ·  ${membersCount.get(wGid)||0} membri
${DOT}
${toBold('Classifica reale')} — dal vivo
${SEP}
◈ Vex Bot`,
        }, { quoted: msg });

        const txt =
`${toBold('TOP GRUPPI')}  ·  ${list.length} gruppi
${SEP}
🥇  ${toBold(wName)}  —  ${wData.n||0} msg
👥  ${membersCount.get(wGid)||0} membri
${DOT}
${toBold('Dettaglio')} → info gruppo
${toBold('Aggiorna')} → ricalcola
${SEP}
◈ Vex Bot`;

        const btns = [
            { label: `🥇 ${String(names.get(list[0]?.[0])||'').slice(0,12)}`, id: 'topgruppi info 1' },
            list[1] ? { label: `🥈 ${String(names.get(list[1][0])||'').slice(0,12)}`, id: 'topgruppi info 2' } : null,
            { label: '📊 Aggiorna', id: 'topgruppi' },
        ].filter(Boolean);

        await sendButtons(sock, from, txt, btns, msg, null, { headerTitle: '🏆 TOP GRUPPI', footerText: '⬇️ Tocca un pulsante' });
    },
};
