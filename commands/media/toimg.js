'use strict';

module.exports = {
    name: 'toimg',
    aliases: ['img', 'jpg'],
    description: "Converte uno sticker in immagine.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isReply) return reply("Rispondi a uno sticker con .toimg");
        const qMsg = contextInfo?.quotedMessage;
        if (!qMsg?.stickerMessage) return reply("Quello non è uno sticker!");

        try {
            const quotedMsg = {
                key: { remoteJid: from, fromMe: false, id: contextInfo.stanzaId, participant: contextInfo.participant },
                message: qMsg,
            };
            const media = await downloadMediaMessage(quotedMsg, 'buffer', {});
            if (!media) return reply("Non riesco a scaricare lo sticker.");
            const img = await sharp(media).png().toBuffer();
            await sock.sendMessage(from, { image: img }, { quoted: msg });
        } catch (e) {
            await reply("Errore: " + e.message);
        }
    },
};
