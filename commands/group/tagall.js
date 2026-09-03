'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

const { flagForJid } = require('../../lib/flag');
module.exports = {
    name: 'tagall',
    aliases: ['tutti', 'menzionatutti'],
    description: "Tagga tutti i membri del gruppo, uno per riga, ognuno con la bandiera del suo paese.",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isSenderAdmin, reply } = context;

        if (!isGroup) {
            return reply(
`📢 *TAGALL*

Funziona solo nei *gruppi* 👥
`
            );
        }
        if (!isSenderAdmin) {
            return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);
        }

        try {
            const meta = await sock.groupMetadata(from);
            const participants = Array.isArray(meta.participants) ? meta.participants : [];
            const allJids = participants.map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);
            const header = textArgs.trim() || '👀 Attenzione a tutti!';
            const lines = allJids.map(id => `${flagForJid(id)} @${id.split('@')[0]}`);

            await sock.sendMessage(from, {
                text:
`📢 *ANNUNCIO DI GRUPPO*

${header}

${lines.join('\n')}

`,
                mentions: allJids,
            }, { quoted: msg });

        } catch (e) {
            console.error('[tagall]', e.message);
            await reply("❌ Non riesco a leggere i partecipanti del gruppo.");
        }
    },
};