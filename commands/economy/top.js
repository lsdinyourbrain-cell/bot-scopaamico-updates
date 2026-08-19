'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOP — Vex Bot
//  .top → classifica dei membri più attivi del gruppo in LISTA NATIVA di
//  WhatsApp (pannello a righe del pulsante nativo, niente tabella ASCII).
//  .top <n> → primi n (max 20). Premendo una riga arriva `.top profilo <n>`
//  che mostra il profilo dell'utente TAGGANDOLO per davvero.
//  I gruppi esclusi con .escludi non mostrano la classifica.
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';

module.exports = {
    name: 'top',
    aliases: ['topattivi', 'attivi', 'classifica'],
    description: "Classifica dei membri più attivi del gruppo: .top oppure .top <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, dispOf, sendButtons } = services;

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
            // `dispOf` mostra il PN reale (mai il numero casuale @lid) e le
            // mentions vengono risolte dal wrapper prima dell'invio: così il
            // testo @<numero> coincide con mentionedJid e il tag evidenzia.
            await sock.sendMessage(from, {
                text:
`🏅 *PROFILO ATTIVITÀ*
${SEP}
▸ @${dispOf(jid)}
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

        // La classifica VIVE nel pannello nativo: il corpo del messaggio è
        // solo il titolo, le righe le apre il pulsante a lista di WhatsApp.
        const txt =
`🏆 *TOP ${limit} ATTIVI* 🏆

📲 Premi *🏅* qui sotto e scegli
un utente: ti mostrerò il suo
profilo e lo TAGGERO' qui in chat.`;

        // Righe del pannello nativo (max 20): i migliori + riga per aggiornare.
        const listRows = sorted.map(([jid, data], i) => ({
            header: `#${i + 1}`,
            title: dispOf(jid),
            description: `${data.msgCount || 0} messaggi`,
            id: `top profilo ${i + 1}`,
        }));
        listRows.push({
            header: '⟳',
            title: '🔄 Aggiorna classifica',
            description: ' ',
            id: 'top',
        });

        const btns = [
            { type: 'single_select', label: '🏅 Scegli un utente', title: '🏆 Top attivi', sectionTitle: 'Classifica', rows: listRows },
            { label: '🔄 Aggiorna', id: 'top' },
        ];
        if (isGroup && (isOwner || isSenderAdmin)) {
            btns.push({ label: '🚫 Escludi', id: 'escludi' });
        } else {
            btns.push({ label: '💎 Ricchi', id: 'ricchi' });
        }

        await sendButtons(sock, from, txt, btns, msg);
    },
};