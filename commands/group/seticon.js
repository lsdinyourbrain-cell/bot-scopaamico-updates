'use strict';

module.exports = {
    name: 'seticon',
    aliases: ['setfoto', 'fotogruppo', 'setpp'],
    description: "Cambia la foto del gruppo (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, isBotAdmin, reply, contextInfo } = context;
        const { downloadMediaMessage } = context.services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const image = quoted?.imageMessage || msg.message?.imageMessage;

        if (!image) return reply("Rispondi a un'immagine con .seticon");

        try {
            const mediaMsg = quoted ? {
                key: { remoteJid: from, fromMe: false, id: contextInfo?.stanzaId },
                message: quoted
            } : msg;
            const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
                logger: console, reuploadRequest: sock.updateMediaMessage
            });
            await sock.updateProfilePicture(from, buffer);
            await reply("✅ Foto gruppo aggiornata!");
        } catch (e) {
            await reply("❌ Errore. Riprova.");
        }
    },
};
