'use strict';

module.exports = {
    name: 'accettarichieste',
    aliases: ['accettarichiesta', 'approvatutti', 'accettatutti'],
    description: "Accetta richieste di adesione: .accettarichieste (tutte) o .accettarichieste 50 (prime 50).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isBotAdmin, isSenderAdmin, reply } = context;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin possono usare questo comando.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");

        let n = null;
        const raw = String(textArgs || args[0] || '').trim();
        if (raw) {
            const parsed = parseInt(raw.replace(/\D/g, ''), 10);
            if (Number.isInteger(parsed) && parsed > 0) n = Math.min(parsed, 1000);
            else if (raw) return reply("⚠️ Uso: *.accettarichieste* oppure *.accettarichieste 50*");
        }

        try {
            const requests = await sock.groupRequestParticipantsList(from);
            if (!requests || requests.length === 0) return reply("📭 Nessuna richiesta in sospeso.");

            const allJids = requests.map(r => r.jid).filter(Boolean);
            const target = n ? allJids.slice(0, n) : allJids;
            if (!target.length) return reply("⚠️ Nessuna richiesta valida.");

            const results = await sock.groupRequestParticipantsUpdate(from, target, 'approve');
            const ok = results.filter(r => !r.status || String(r.status) === '200').length;

            return reply(
`✅ *RICHIESTE ACCETTATE*
━━━━━━━━━━━━━━
▸ Accettate *${ok}* su *${target.length}* richieste${n ? ` (prime ${n})` : ''}.
▸ Totali in attesa prima: *${allJids.length}*.
━━━━━━━━━━━━━━
◈ _Vex Bot_`
            );
        } catch (e) {
            console.error('[accettarichieste]', e.message);
            return reply("⚠️ Errore durante l'approvazione. Il bot è admin?");
        }
    },
};
