'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOP — Vex Bot
//  .top → classifica dei membri più attivi del gruppo (tabella nativa con
//  pulsante a lista: scegli un utente per vederne il profilo taggandolo).
//  .top <n> → mostra i primi n (max 20).
//  I gruppi esclusi con .escludi non mostrano la classifica.
// ─────────────────────────────────────────────────────────────────────────────

const { renderTable } = require('../../lib/table');

const SEP = '━━━━━━━━━━━━━━━━━━';

module.exports = {
    name: 'top',
    aliases: ['topattivi', 'attivi', 'classifica'],
    description: "Classifica dei membri più attivi del gruppo: .top oppure .top <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, dispOf, sendButtons, getCachedGroupMeta } = services;

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
            .filter(([jid, data]) => jid.includes('@') && data && typeof data === 'object' && (data.msgCount || 0) > 0)
            .sort((a, b) => (b[1].msgCount || 0) - (a[1].msgCount || 0))
            .slice(0, 20);

        // ── PROFILO UTENTE (dalla lista nativa) ───────────────────────────
        // Quando si preme una voce della lista, arriva `.top profilo <n>`.
        if (String(args[0] || '').toLowerCase() === 'profilo') {
            const idx = parseInt(args[1], 10);
            const entry = allSorted[idx - 1];
            if (!entry) return reply('⚠️ Indice non valido: la classifica è cambiata, riprova.');
            const [jid, data] = entry;
            await sock.sendMessage(from, {
                text:
`🏅 *PROFILO ATTIVITÀ*
${SEP}
▸ @${disp(jid)}
▸ 💬 Messaggi: *${data.msgCount || 0}*
${SEP}
◈ _Vex Bot_`,
                mentions: [jid],
            }, { quoted: msg });
            return;
        }

        const sorted = allSorted.slice(0, limit);

        if (sorted.length === 0) return reply(
`📭 *NESSUNA ATTIVITÀ*
${SEP}
▸ Nessun dato disponibile.
▸ Scrivi in chat e torna qui:
  la tua attività verrà contata!
${SEP}
◈ _Vex Bot_`);

        const rows = sorted.map(([jid, data], i) => [
            String(i + 1),
            '@' + disp(jid),
            String(data.msgCount || 0),
        ]);

        const txt =
`🏆 *TOP ${limit} ATTIVI* 🏆
${renderTable([
    { header: 'NO', align: 'r', max: 3 },
    { header: 'UTENTE', align: 'l', max: 18 },
    { header: 'MSG', align: 'r', max: 7 },
], rows)}
▸ Premi *🏅* e scegli un utente
  per vederne il profilo.`;

        const listRows = sorted.slice(0, 10).map(([jid, data], i) => ({
            header: `#${i + 1}`,
            title: disp(jid),
            description: `${data.msgCount || 0} messaggi`,
            id: `top profilo ${i + 1}`,
        }));

        const btns = [
            { type: 'single_select', label: '🏅 Scegli un utente', title: '🏆 Top attivi', sectionTitle: 'Classifica', rows: listRows },
            { label: '🔄 Aggiorna', id: 'top' },
        ];
        if (isGroup && (isOwner || isSenderAdmin)) {
            btns.push({ label: '🚫 Escludi', id: 'escludi' });
        } else {
            btns.push({ label: '💎 Ricchi', id: 'ricchi' });
        }

        await sendButtons(sock, from, txt, btns, msg, sorted.map(([jid]) => jid).slice(0, 20));
    },
};