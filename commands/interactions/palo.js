'use strict';

module.exports = {
    name: 'palo',
    aliases: [],
    description: "Esegue il comando .palo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!targetJid) return reply("⚠️ _Tagga chi ti ha dato palo. Esempio: .palo @nome_");
            await sock.sendMessage(from, {
                text: `🛑 *_PALO_*\n━━━━━━━━━━━━━━\n▸ 💔 @${sender.split('@')[0]} ha provato con @${targetJid.split('@')[0]}\n▸ _💬 ${randomChoice(ARRAYS.palo)}_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                mentions: [sender, targetJid],
            });
    },
};
