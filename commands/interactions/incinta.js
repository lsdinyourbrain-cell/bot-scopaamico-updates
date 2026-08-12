'use strict';

module.exports = {
    name: 'incinta',
    aliases: [],
    description: "Esegue il comando .incinta.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!targetJid) return reply("Tagga una persona oppure rispondi a un suo messaggio.");
            const percent = randomInt(1, 100);
            await sock.sendMessage(from, {
                text: `🍼 *TEST DI FANTASIA*\n━━━━━━━━━━━━━━━━━━\n@${targetJid.split('@')[0]}\noggi risulta al *${percent}%*\nincinta/o. È solo un gioco eh 😭\n━━━━━━━━━━━━━━━━━━`,
                mentions: [targetJid],
            });
    },
};
