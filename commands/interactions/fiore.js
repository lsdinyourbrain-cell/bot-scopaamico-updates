'use strict';

module.exports = {
    name: 'fiore',
    aliases: [],
    description: "Esegue il comando .fiore.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const recipient = targetJid || sender;
            const flower = randomChoice(ARRAYS.fiori);
            await sock.sendMessage(from, {
                text: `🌷 *UN FIORE PER TE*\n━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} regala\n@${recipient.split('@')[0]}\n${flower} ✨\n━━━━━━━━━━━━━━━━━━`,
                mentions: [sender, recipient],
            }, { quoted: msg });
    },
};
