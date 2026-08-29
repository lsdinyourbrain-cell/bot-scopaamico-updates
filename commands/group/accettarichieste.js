'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'accettarichieste',
    aliases: ['accettarichiesta', 'approvatutti', 'accettatutti'],
    description: "Accetta richieste di adesione: .accettarichieste (tutte) o .accettarichieste 50 (prime 50).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isBotAdmin, isSenderAdmin, reply } = context;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin possono usare questo comando.')}
${boxEnd()}`);
        if (!isBotAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('rendimi admin prima.')}
${boxEnd()}`);

        let n = null;
        const raw = String(textArgs || args[0] || '').trim();
        if (raw) {
            const parsed = parseInt(raw.replace(/\D/g, ''), 10);
            if (Number.isInteger(parsed) && parsed > 0) n = Math.min(parsed, 1000);
            else if (raw) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Uso: *.accettarichieste* oppure *.accettarichieste 50')}
${boxEnd()}`);
        }

        try {
            const requests = await sock.groupRequestParticipantsList(from);
            if (!requests || requests.length === 0) return reply("📭 Nessuna richiesta in sospeso.");

            const allJids = requests.map(r => r.jid).filter(Boolean);
            const target = n ? allJids.slice(0, n) : allJids;
            if (!target.length) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Nessuna richiesta valida.')}
${boxEnd()}`);

            const results = await sock.groupRequestParticipantsUpdate(from, target, 'approve');
            const ok = results.filter(r => !r.status || String(r.status) === '200').length;

            return reply(
`✅ *RICHIESTE ACCETTATE*
▸ Accettate *${ok}* su *${target.length}* richieste${n ? ` (prime ${n})` : ''}.
▸ Totali in attesa prima: *${allJids.length}*.
`
            );
        } catch (e) {
            console.error('[accettarichieste]', e.message);
            return reply("⚠️ Errore durante l'approvazione. Il bot è admin?");
        }
    },
};
