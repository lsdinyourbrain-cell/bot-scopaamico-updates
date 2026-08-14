'use strict';

module.exports = {
    name: 'drink',
    aliases: [],
    description: "Esegue il comando .drink.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const target = targetJid || sender;
            await sock.sendMessage(from, {
                text: `🍹 *_DRINK_*\n━━━━━━━━━━━━━━\n▸ @${sender.split('@')[0]} offre a @${target.split('@')[0]}:\n▸ 🥂 _*${randomChoice(ARRAYS.drink)}*_\n▸ _Cin cin! 🎉_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                mentions: [sender, target],
            });
    },
};
