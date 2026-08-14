'use strict';

module.exports = {
    name: 'report',
    aliases: ['segnala', 'bug', 'errore'],
    description: "Invia una segnalazione/bug all'owner del bot. Il messaggio riportato viene inoltrato in privato all'owner.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { ownerNumber } = services;

        const issue = String(textArgs || '').trim();
        if (!issue) {
            return reply('⚠️ _[uso]:_ scrivi il problema da segnalare.\n▸ \`.report ho trovato un bug...\`');
        }

        const ownerJid = String(ownerNumber || '').includes('@') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`;

        try {
            const senderLabel = `${sender.split('@')[0]} (${isGroup ? 'in gruppo' : 'in privato'})`;
            await sock.sendMessage(ownerJid, {
                text: `🐛 *_SEGNALAZIONE_*\n━━━━━━━━━━━━━━━━━━\n▸ 👤 Da: _${senderLabel}_\n▸ 📍 Chat: _${from}_\n━━━━━━━━━━━━━━━━━━\n▸ 📝 ${issue.slice(0, 1000)}`,
            });
            await reply(
`✅ *_SEGNALAZIONE INVIATA_*
━━━━━━━━━━━━━━━━━━
▸ Segnalazione inviata al
  creatore del bot.
▸ Grazie per l'aiuto! 🙏
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);
        } catch (_) {
            await reply('❌ Non riesco a inoltrare la segnalazione. Riprova più tardi.');
        }
    },
};