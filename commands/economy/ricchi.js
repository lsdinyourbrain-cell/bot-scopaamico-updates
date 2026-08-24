'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  RICCHI — Vex Bot · v2 Premium
//  .ricchi → classifica ricchi: ENTRAMBI immagine + pulsanti
//  Tabella vera con POS | UTENTE | CONTANTI | BANCA
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━━━';
const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';
const { renderLeaderboardImage } = require('../../lib/leaderboard');

const toBold = (s) => '*' + String(s||'').trim() + '*';
module.exports = {
    name: 'ricchi',
    aliases: ['topricchi', 'ricchi-top', 'classificaricchi'],
    description: "Classifica dei membri più ricchi del gruppo: .ricchi oppure .ricchi <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, dispOf, formatMoney, sendButtons } = services;

        if (!isGroup) return reply("❌ Comando solo nei gruppi.");
        if (db._escludi?.[from]) {
            return reply(
`🚫  ${toBold('CLASSIFICA DISATTIVATA')}
${SEP}
▸ Gruppo escluso con ${toBold('.escludi')}
▸ Un admin può riammettere con
  ${toBold('.escludi off')}
${SEP}
◈ Vex Bot`);
        }

        const want = parseInt(String(textArgs || '').trim(), 10);
        const limit = Number.isInteger(want) && want > 0 ? Math.min(want, 20) : 5;

        const chatUsers = db[from] || {};
        const allSorted = Object.entries(chatUsers)
            .filter(([jid, data]) => jid.includes('@') && data && typeof data === 'object')
            .sort((a, b) => (b[1].money || 0) - (a[1].money || 0))
            .slice(0, 20);

        if (String(args[0] || '').toLowerCase() === 'profilo') {
            const idx = parseInt(args[1], 10);
            const entry = allSorted[idx - 1];
            if (!entry) return reply('⚠️ Indice non valido: classifica cambiata, riprova.');
            const [jid, data] = entry;
            const txt =
`${toBold('PROFILO RICCHEZZA')}  ·  #${idx}
${SEP}
👤  @${dispOf(jid)}
💰  Contanti: ${toBold(formatMoney(data.money||0))}
🏦  Banca: ${toBold(formatMoney(data.bank||0))}
💎  Totale: ${toBold(formatMoney((data.money||0)+(data.bank||0)))}
${SEP}
◈ Vex Bot`;
            await sock.sendMessage(from, { text: txt, mentions: [jid] }, { quoted: msg });
            const btns = [
                { label: '📊 Tabella', id: 'ricchi' },
                { label: '🏠 Menu', id: 'menu' },
            ];
            await sendButtons(sock, from, `${toBold('AZIONI')} — @${dispOf(jid)}`, btns, msg, [jid], { headerTitle: '💎 Profilo', footerText: '⬇️ Scegli' });
            return;
        }

        if (!allSorted.length) return reply(
`📭  ${toBold('NESSUNA RICCHEZZA')}
${SEP}
▸ Nessun dato disponibile.
▸ Lavora, gioca e vinci!
${SEP}
◈ Vex Bot`);

        const sorted = allSorted.slice(0, limit);
        const top10 = allSorted.slice(0, 10);

        const rowsImg = top10.map(([jid, data]) => ({
            name: dispOf(jid),
            money: formatMoney(data.money||0),
            bank: formatMoney(data.bank||0),
        }));

        let png;
        try {
            png = await renderLeaderboardImage({
                title: 'TOP RICCHI',
                subtitle: 'Patrimonio: contanti + banca',
                accent: '#fbbf24',
                accent2: '#f59e0b',
                rows: rowsImg,
            });
        } catch (e) {
            console.error('[ricchi] render:', e.message);
            return reply('⚠️ Errore tabella, riprova.');
        }

        const [leaderJid, leaderData] = allSorted[0];
        const leaderName = dispOf(leaderJid);

        await sock.sendMessage(from, {
            image: png,
            mimetype: 'image/png',
            caption:
`💎  ${toBold('TOP 10 RICCHI')}  💎
${SEP}
🥇  @${leaderName}  ·  ${formatMoney(leaderData.money||0)}  ·  banca ${formatMoney(leaderData.bank||0)}
${DOT}
${toBold('Classifica reale')} — dati live
${SEP}
◈ Vex Bot`,
            mentions: [leaderJid],
        }, { quoted: msg });

        const txt =
`${toBold('TOP')} ${toBold(String(limit))} ${toBold('RICCHI')}  ·  ${sorted.length}/${allSorted.length}
${SEP}
🥇  @${leaderName}  —  ${toBold(formatMoney(leaderData.money||0))}  ·  banca ${formatMoney(leaderData.bank||0)}
${DOT}
${toBold('Dettaglio')} → profilo utente
${toBold('Aggiorna')} → ricalcola
${SEP}
◈ Vex Bot`;

        const secondJid = allSorted[1]?.[0];
        const secondName = secondJid ? dispOf(secondJid) : null;
        const btns = [
            { label: `🥇 ${leaderName.slice(0,12)}`, id: 'ricchi profilo 1' },
            secondName ? { label: `🥈 ${secondName.slice(0,12)}`, id: 'ricchi profilo 2' } : null,
            { label: '📊 Aggiorna', id: 'ricchi' },
        ].filter(Boolean);

        await sendButtons(sock, from, txt, btns, msg, [leaderJid, secondJid].filter(Boolean), { headerTitle: '💎 TOP RICCHI', footerText: '⬇️ Tocca un pulsante' });
    },
};
