'use strict';

module.exports = {
    name: 'cazzo',
    aliases: [],
    description: "Esegue il comando .cazzo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const target = targetJid || sender;
            const valore = Math.floor(Math.random() * 30) + 1;
            const tipo   = valore < 5 ? 'Microscopico' : valore < 15 ? 'Sotto la media' : valore < 25 ? 'Nella media' : 'Illegale 🚨';
            await sock.sendMessage(from, {
                text: `🍆 *MISURAZIONE*\n━━━━━━━━━━━━━━━━━━\n👤 @${target.split('@')[0]}\n📏 *${valore} cm* _(${tipo})_\n━━━━━━━━━━━━━━━━━━\n_💬 ${randomChoice(ARRAYS.cazzo)}_`,
                mentions: [target],
            });
    },
};
