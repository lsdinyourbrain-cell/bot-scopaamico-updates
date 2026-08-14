'use strict';

module.exports = {
    name: 'hack',
    aliases: [],
    description: "Esegue il comando .hack.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!targetJid) return reply("⚠️ _[uso]: tagga una persona: è solo una scenetta, promesso._");
            const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            try {
                const fake = await sock.sendMessage(from, {
                    text: `💻 Avvio la scenetta su @${targetJid.split('@')[0]}…`,
                    mentions: [targetJid],
                }, { quoted: msg });
                await pause(700);
                await sock.sendMessage(from, { text: '🔎 Cerco meme compromettenti…', edit: fake.key });
                await pause(700);
                await sock.sendMessage(from, { text: '📦 Recupero un sacco di figuracce…', edit: fake.key });
                await pause(700);
                await sock.sendMessage(from, {
                    text: `✅ Fatto. @${targetJid.split('@')[0]} è stato/a hackerato/a… per finta 😭`,
                    edit: fake.key,
                    mentions: [targetJid],
                });
            } catch (_) {
                await reply("❌ La scenetta si è impallata, riprova.");
            }
    },
};
