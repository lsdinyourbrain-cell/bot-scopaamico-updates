'use strict';

const sharp = require('sharp');

module.exports = {
    name: 'rubato',
    aliases: ['sticker2img', 's2i', 'rubaimg'],
    description: 'Converte uno sticker in immagine salvabile.',

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, reply, isReply, contextInfo, services } = context;
        const { downloadMediaMessage } = services;

        try {
            if (!isReply || !contextInfo.quotedMessage) {
                return reply('⚠️ _[uso]: rispondi a uno *sticker* con *.rubato* per convertirlo in immagine salvabile._');
            }

            const quoted = contextInfo.quotedMessage;
            const stickerMsg = quoted.stickerMessage || quoted.ephemeralMessage?.message?.stickerMessage;

            if (!stickerMsg) {
                return reply('❌ Il messaggio a cui rispondi non è uno sticker.');
            }

            await reply('🔄 *Conversione in corso...*');

            const quotedMsg = {
                key: {
                    id: contextInfo.stanzaId,
                    remoteJid: from,
                    fromMe: contextInfo.participant === (sock.user?.id || ''),
                    participant: contextInfo.participant
                },
                message: {
                    stickerMessage: stickerMsg
                }
            };

            const buffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
            const imageBuffer = await sharp(buffer).png().toBuffer();

            await sock.sendMessage(from, {
                image: imageBuffer,
                caption: '✅ *_STICKER → IMMAGINE_*\n━━━━━━━━━━━━━━\n▸ _Sticker convertito in immagine!_\n▸ Ora puoi _salvarla nel rullino_.\n◈ _Vex Bot_'
            }, { quoted: msg });

        } catch (e) {
            console.error('[rubato]', e);
            await reply('❌ Errore durante la conversione dello sticker.');
        }
    },
};