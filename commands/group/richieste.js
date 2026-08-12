'use strict';

module.exports = {
    name: 'richieste',
    aliases: ['approva', 'accetta'],
    description: "Mostra le richieste di adesione con i numeri e accetta/rifiuta tutte con un pulsante.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { sendButtons } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono usare questo comando.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        // Se il comando arriva da un pulsante premuto, textArgs contiene
        // l'azione scelta: "accetta" oppure "rifiuta".
        const action = String(textArgs || args[0] || '').toLowerCase().trim();

        if (isButton && (action === 'accetta' || action === 'rifiuta')) {
            try {
                const requests = await sock.groupRequestParticipantsList(from);
                if (!requests || requests.length === 0) return reply("Nessuna richiesta in sospeso.");
                const jids = requests.map(r => r.jid).filter(Boolean);
                if (!jids.length) return reply("Nessuna richiesta valida da processare.");

                const results = await sock.groupRequestParticipantsUpdate(from, jids, action === 'accetta' ? 'approve' : 'reject');
                const ok = results.filter(r => !r.status || r.status === '200').length;
                const verb = action === 'accetta' ? 'accolte' : 'rifiutate';
                return reply(
`✅ *Richieste ${verb.toUpperCase()}!*\n\nHai ${action === 'accetta' ? 'accettato' : 'rifiutato'} *${ok}* su *${jids.length}* richieste di adesione.`
                );
            } catch (e) {
                console.error('[richieste]', e.message);
                return reply("❌ Errore durante l'operazione. Il bot è admin?");
            }
        }

        // ── Lista richieste ──────────────────────────────────────────────
        try {
            const requests = await sock.groupRequestParticipantsList(from);
            if (!requests || requests.length === 0) return reply("Nessuna richiesta in sospeso.");

            const rows = requests.map((r, i) => {
                const num = (r.jid || '').split('@')[0] || r.phoneNumber || 'sconosciuto';
                return `${String(i + 1).padStart(2, '0')} ☎️ +${num}`;
            }).join('\n');

            const text =
`📥 *RICHIESTE DI ADESIONE*
━━━━━━━━━━━━━━━━━━
${rows}

Cosa vuoi fare?`;

            await sendButtons(sock, from, text, [
                { label: '✅ Accetta tutte', id: 'richieste accetta' },
                { label: '❌ Rifiuta tutte', id: 'richieste rifiuta' },
            ], msg);
        } catch (e) {
            console.error('[richieste]', e.message);
            await reply("❌ Errore nel recupero delle richieste. Il bot è admin?");
        }
    },
};
