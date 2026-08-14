'use strict';

module.exports = {
    name: 'd',
    aliases: [],
    description: "Alias rapido per .demote.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("⚠️ _[uso]:_ comando riservato agli admin.");
            if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");
            if (!targetJid || sameJid(targetJid, sender)) return reply("⚠️ _[uso]:_ tagga un utente da degradare.");
            try {
                await sock.groupParticipantsUpdate(from, [targetJid], 'demote');
                await sock.sendMessage(from, { text: `⬇️ *_DEMOTE_*
━━━━━━━━━━━━━━
▸ @${targetJid.split('@')[0]} non è più *admin*.
━━━━━━━━━━━━━━
◈ _Vex Bot_`, mentions: [targetJid] }, { quoted: msg });
            } catch (e) {
                await reply("⚠️ _[uso]:_ non riesco a degradare. Controlla i permessi.");
            }
    },
};
