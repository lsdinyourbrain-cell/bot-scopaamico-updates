'use strict';

module.exports = {
    name: 'p',
    aliases: [],
    description: "Alias rapido per .promote.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("⚠️ _[uso]:_ comando riservato agli admin.");
            if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");
            if (!targetJid || sameJid(targetJid, sender)) return reply("⚠️ _[uso]:_ tagga un utente da promuovere.");
            try {
                await sock.groupParticipantsUpdate(from, [targetJid], 'promote');
                await sock.sendMessage(from, { text: `👑 *_PROMOTE_*
━━━━━━━━━━━━━━
▸ @${targetJid.split('@')[0]} *promosso* admin!
━━━━━━━━━━━━━━
◈ _Vex Bot_`, mentions: [targetJid] }, { quoted: msg });
            } catch (e) {
                await reply("⚠️ _[uso]:_ non riesco a promuovere. Controlla i permessi.");
            }
    },
};
