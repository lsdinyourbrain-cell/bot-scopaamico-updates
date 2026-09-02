'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'report',
    aliases: ['segnala', 'bug', 'errore'],
    description: "Invia una segnalazione/bug all'owner del bot. Il messaggio riportato viene inoltrato in privato all'owner.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { ownerNumber } = services;

        const issue = String(textArgs || '').trim();
        if (!issue) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('scrivi il problema da segnalare. ▸ \\`.report ho trovato un bug...\\`')}
${boxEnd()}`);
        }

        const ownerJid = String(ownerNumber || '').includes('@') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`;

        try {
            const senderLabel = `${sender.split('@')[0]} (${isGroup ? 'in gruppo' : 'in privato'})`;
            await sock.sendMessage(ownerJid, {
                text: `${sec('SEGNALAZIONE')}\n${boxOpen()}\n${line(`🐛 *_SEGNALAZIONE_*\n\n▸ 👤 Da: _${senderLabel}_\n▸ 📍 Chat: _${from}_\n\n▸ 📝 ${issue.slice(0, 1000)}`)}\n${boxEnd()}`,
            });
            await reply(
`${sec('SEGNALAZIONE INVIATA')}\n${boxOpen()}\n${line('Segnalazione inviata al')}\n${line('creatore del bot.')}\n${line('Grazie per l\'aiuto! 🙏')}\n${boxEnd()}`);
        } catch (_) {
            await reply('❌ Non riesco a inoltrare la segnalazione. Riprova più tardi.');
        }
    },
};