'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  RICCHI — Vex Bot
//  .ricchi → classifica dei membri più ricchi del gruppo (tabella nativa con
//  pulsante a lista: scegli un utente per vederne il profilo taggandolo).
//  .ricchi <n> → mostra i primi n (max 20).
//  I gruppi esclusi con .escludi non mostrano la classifica.
// ─────────────────────────────────────────────────────────────────────────────

const { renderTable } = require('../../lib/table');

const SEP = '━━━━━━━━━━━━━━━━━━';

module.exports = {
    name: 'ricchi',
    aliases: ['topricchi', 'ricchi-top', 'classificaricchi'],
    description: "Classifica dei membri più ricchi del gruppo: .ricchi oppure .ricchi <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, dispOf, formatMoney, sendButtons, getCachedGroupMeta } = services;

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

        // In LID mode i jid salvati sono @lid: risolviamo il PN reale per
        // mostrare i numeri veri nella tabella e nei tag.
        let metaMap = null;
        try {
            const meta = await getCachedGroupMeta(sock, from);
            metaMap = new Map((meta?.participants || [])
                .map(p => [String(p?.id || p?.jid || '').toLowerCase().replace(/:\d+(?=@)/, ''), p?.phoneNumber])
                .filter(([k, v]) => k && v));
        } catch (_) {}
        const disp = (jid) => {
            const pn = metaMap?.get(String(jid).toLowerCase().replace(/:\d+(?=@)/, ''));
            return pn ? pn.split('@')[0] : dispOf(jid);
        };

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
            await sock.sendMessage(from, {
                text:
`💎 *PROFILO RICCHEZZA*
${SEP}
▸ @${disp(jid)}
▸ 💰 Saldo: *${formatMoney(data.money || 0)}*
▸ 🏦 Banca: *${formatMoney(data.bank || 0)}*
${SEP}
◈ _Vex Bot_`,
                mentions: [jid],
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

        const rows = sorted.map(([jid, data], i) => [
            String(i + 1),
            '@' + disp(jid),
            (data.money || 0) > 0 ? formatMoney(data.money) : '0€',
        ]);

        const txt =
`💎 *TOP ${limit} RICCHI* 💎
${renderTable([
    { header: 'NO', align: 'r', max: 3 },
    { header: 'UTENTE', align: 'l', max: 18 },
    { header: 'SALDO', align: 'r', max: 14 },
], rows)}
▸ Premi *💎* e scegli un utente
  per vederne il profilo.`;

        const listRows = sorted.slice(0, 10).map(([jid, data], i) => ({
            header: `#${i + 1}`,
            title: disp(jid),
            description: `${formatMoney(data.money || 0)}`,
            id: `ricchi profilo ${i + 1}`,
        }));

        const btns = [
            { type: 'single_select', label: '💎 Scegli un utente', title: '💎 Top ricchi', sectionTitle: 'Classifica', rows: listRows },
            { label: '🔄 Aggiorna', id: 'ricchi' },
        ];
        if (isGroup && (isOwner || isSenderAdmin)) {
            btns.push({ label: '🚫 Escludi', id: 'escludi' });
        } else {
            btns.push({ label: '🏆 Attivi', id: 'top' });
        }

        await sendButtons(sock, from, txt, btns, msg, sorted.map(([jid]) => jid).slice(0, 20));
    },
};