'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'seticon',
    aliases: ['setfoto', 'setimg', 'setpp'],
    description: "Cambia la foto del gruppo (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, isBotAdmin, reply, contextInfo } = context;
        const { downloadMediaMessage } = context.services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin.')}
${boxEnd()}`);
        if (!isBotAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('rendimi admin prima.')}
${boxEnd()}`);

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
            await reply(`${sec('FOTO GRUPPO')}\n${boxOpen()}\n${line('Foto gruppo *aggiornata*!')}\n${boxEnd()}`);
        } catch (e) {
            await reply("⚠️ _[uso]:_ errore. Riprova.");
        }
    },
};
