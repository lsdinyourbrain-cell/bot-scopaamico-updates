'use strict';

module.exports = {
    name: 'seticon',
    aliases: ['setfoto', 'setimg', 'setpp'],
    description: "Cambia la foto del gruppo (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, isBotAdmin, reply, contextInfo } = context;
        const { downloadMediaMessage } = context.services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const image = quoted?.imageMessage || msg.message?.imageMessage;

        if (!image) return reply("⚠️ _[uso]:_ rispondi a un'immagine con .seticon");

        try {
            const mediaMsg = quoted ? {
                key: { remoteJid: from, fromMe: false, id: contextInfo?.stanzaId },
                message: quoted
            } : msg;
            const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
                logger: console, reuploadRequest: sock.updateMediaMessage
            });
            await sock.updateProfilePicture(from, buffer);
            await reply(`✅ *_FOTO GRUPPO_*
━━━━━━━━━━━━━━
▸ Foto gruppo *aggiornata*!
━━━━━━━━━━━━━━
◈ _Vex Bot_`);
        } catch (e) {
            await reply("⚠️ _[uso]:_ errore. Riprova.");
        }
    },
};
