'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'richieste',
    aliases: ['approva', 'accetta'],
    description: "Mostra le richieste di adesione con i numeri e accetta/rifiuta tutte con un pulsante.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { sendButtons } = services;

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

        // Se il comando arriva da un pulsante premuto, textArgs contiene
        // l'azione scelta: "accetta" oppure "rifiuta".
        const action = String(textArgs || args[0] || '').toLowerCase().trim();

        if (isButton && (action === 'accetta' || action === 'rifiuta')) {
            try {
                const requests = await sock.groupRequestParticipantsList(from);
                if (!requests || requests.length === 0) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('nessuna richiesta in sospeso.')}
${boxEnd()}`);
                const jids = requests.map(r => r.jid).filter(Boolean);
                if (!jids.length) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('nessuna richiesta valida da processare.')}
${boxEnd()}`);

                const results = await sock.groupRequestParticipantsUpdate(from, jids, action === 'accetta' ? 'approve' : 'reject');
                const ok = results.filter(r => !r.status || r.status === '200').length;
                const verb = action === 'accetta' ? 'accolte' : 'rifiutate';
                return reply(
`✅ *_RICHIESTE ${verb.toUpperCase()}_*
▸ Hai ${action === 'accetta' ? 'accettato' : 'rifiutato'} *${ok}* su *${jids.length}* richieste di adesione.
`
                );
            } catch (e) {
                console.error('[richieste]', e.message);
                return reply("⚠️ _[uso]:_ errore durante l'operazione. Il bot è admin?");
            }
        }

        // ── Lista richieste 
        try {
            const requests = await sock.groupRequestParticipantsList(from);
            if (!requests || requests.length === 0) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('nessuna richiesta in sospeso.')}
${boxEnd()}`);

            const display = requests.slice(0, 20);
            const rows = display.map((r, i) => {
                const num = r.phoneNumber || (r.jid || '').split('@')[0] || 'sconosciuto';
                return `${String(i + 1).padStart(2, '0')} ☎️ +${num}`;
            }).join('\n');
            const extra = requests.length > 20 ? `\n… e altre *${requests.length - 20}* richieste` : '';
            const text =
`📥 *_RICHIESTE DI ADESIONE_* — *${requests.length}* in attesa
${rows}${extra}
▸ Usa i pulsanti o *.accettarichieste 50*`;

            await sendButtons(sock, from, text, [
                { label: '✅ Accetta tutte', id: 'richieste accetta' },
                { label: '❌ Rifiuta tutte', id: 'richieste rifiuta' },
            ], msg);
        } catch (e) {
            console.error('[richieste]', e.message);
            await reply("⚠️ _[uso]:_ errore nel recupero delle richieste. Il bot è admin?");
        }
    },
};
