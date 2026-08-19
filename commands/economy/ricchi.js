'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  RICCHI — Vex Bot
//  .ricchi → classifica dei membri più ricchi del gruppo. Pulsante *📊 Vedi
//  tabella* → VERA TABELLA in immagine (niente sezioni nate da pannelli
//  nativi). *💎 Scegli un utente* → profilo con tag reale. I gruppi esclusi
//  con .escludi non mostrano la classifica.
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';
const { renderLeaderboardImage } = require('../../lib/leaderboard');

module.exports = {
    name: 'ricchi',
    aliases: ['topricchi', 'ricchi-top', 'classificaricchi'],
    description: "Classifica dei membri più ricchi del gruppo: .ricchi oppure .ricchi <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, dispOf, formatMoney, sendButtons } = services;

        if (!isGroup) return reply("❌ Comando disponibile solo nei gruppi.");
        if (db._escludi?.[from]) {
            return reply(
`🚫 *CLASSIFICA DISATTIVATA*
${SEP}
▸ Questo gruppo è escluso dalle
  classifiche (con .escludi).
▸ Un admin può riammetterlo con
  \`.escludi off\`.
${SEP}
◈ _Vex Bot_`);
        }

        const want = parseInt(String(textArgs || '').trim(), 10);
        const limit = Number.isInteger(want) && want > 0 ? Math.min(want, 20) : 5;

        const chatUsers = db[from] || {};
        // Classifica completa (top 20): usata per il display e per i pulsanti.
        const allSorted = Object.entries(chatUsers)
            .filter(([jid, data]) => jid.includes('@') && data && typeof data === 'object')
            .sort((a, b) => (b[1].money || 0) - (a[1].money || 0))
            .slice(0, 20);

        // ── PROFILO UTENTE (dalla lista nativa) ───────────────────────────
        // Quando si preme una voce della lista, arriva `.ricchi profilo <n>`.
        if (String(args[0] || '').toLowerCase() === 'profilo') {
            const idx = parseInt(args[1], 10);
            const entry = allSorted[idx - 1];
            if (!entry) return reply('⚠️ Indice non valido: la classifica è cambiata, riprova.');
            const [jid, data] = entry;
            // `dispOf` mostra il PN reale (mai il numero casuale @lid) e le
            // mentions vengono risolte dal wrapper prima dell'invio: così il
            // testo @<numero> coincide con mentionedJid e il tag evidenzia.
            await sock.sendMessage(from, {
                text:
`💎 *PROFILO RICCHEZZA*
${SEP}
▸ @${dispOf(jid)}
▸ 💰 Saldo: *${formatMoney(data.money || 0)}*
▸ 🏦 Banca: *${formatMoney(data.bank || 0)}*
${SEP}
◈ _Vex Bot_`,
                mentions: [jid],
            }, { quoted: msg });
            return;
        }

        // ── TABELLA IN IMMAGINE ───────────────────────────────────────────
        // `.ricchi tabella` (o il pulsante 📊) → VERA tabella PNG, non una
        // sezione nativa. La didascalia TAGG il più ricco con il PN reale.
        if (String(args[0] || '').toLowerCase() === 'tabella') {
            const top10 = allSorted.slice(0, 10);
            if (!top10.length) return reply('📭 Nessun dato disponibile: lavora, gioca e vinci!');
            const rows = top10.map(([jid, data]) => ({ name: dispOf(jid), value: formatMoney(data.money || 0) }));
            let png;
            try {
                png = await renderLeaderboardImage({
                    title: 'TOP RICCHI',
                    subtitle: 'Saldo in contanti in questo gruppo',
                    accent: '#fbbf24',
                    accent2: '#f59e0b',
                    rows,
                });
            } catch (e) {
                console.error('[ricchi] render tabella:', e.message);
                return reply('⚠️ Errore generando la tabella, riprova.');
            }
            const [wJid] = top10[0];
            await sock.sendMessage(from, {
                image: png,
                mimetype: 'image/png',
                caption:
`💎 *TOP 10 RICCHI* 💎
${SEP}
🥇 @${dispOf(wJid)} è il più ricco
  del gruppo! Che status!
${SEP}
◈ _Vex Bot_`,
                mentions: [wJid],
            }, { quoted: msg });
            return;
        }

        const sorted = allSorted.slice(0, limit);

        if (sorted.length === 0) return reply(
`📭 *NESSUNA RICCHEZZA*
${SEP}
▸ Nessun dato disponibile.
▸ Lavora, gioca e vinci:
  la tua ricchezza verrà
  mostrata qui!
${SEP}
◈ _Vex Bot_`);

        // Corpo del messaggio: titolo + LEADER TAGGATO per davvero.
        const [leaderJid] = allSorted[0];
        const txt =
`💎 *TOP ${limit} RICCHI* 💎
${SEP}
🥇 @${dispOf(leaderJid)} domina!
${SEP}
📲 Premi *📊* per la tabella
completa, *💎* per il profilo
di un utente (lo TAGGO qui).`;

        // Righe del pannello nativo (max 20): i migliori + riga per aggiornare.
        const listRows = sorted.map(([jid, data], i) => ({
            header: `#${i + 1}`,
            title: dispOf(jid),
            description: `${formatMoney(data.money || 0)}`,
            id: `ricchi profilo ${i + 1}`,
        }));
        listRows.push({
            header: '⟳',
            title: '🔄 Aggiorna classifica',
            description: ' ',
            id: 'ricchi',
        });

        const btns = [
            { label: '📊 Vedi tabella', id: 'ricchi tabella' },
            { type: 'single_select', label: '💎 Scegli un utente', title: '💎 Top ricchi', sectionTitle: 'Classifica', rows: listRows },
        ];
        if (isGroup && (isOwner || isSenderAdmin)) {
            btns.push({ label: '🚫 Escludi', id: 'escludi' });
        } else {
            btns.push({ label: '🔄 Aggiorna', id: 'ricchi' });
        }

        await sendButtons(sock, from, txt, btns, msg, [leaderJid]);
    },
};