'use strict';

module.exports = {
    name: 'rate',
    aliases: ['valuta'],
    description: "Il bot giudica qualcosa da 1 a 10.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply("⚠️ _[uso]: Cosa devo giudicare? Es: .rate pizza_");

        const score = Math.floor(Math.random() * 11);
        const emojis = ['💩','😤','😐','😒','🙂','😊','👍','🔥','❤️','💎','👑'];
        const bar = '█'.repeat(score) + '░'.repeat(10 - score);
        const comment = score <= 2 ? "Penoso." : score <= 4 ? "Meh." : score <= 6 ? "Niente male." : score <= 8 ? "Bello!" : score <= 9 ? "Eccellente!" : "🎯 PERFETTO!";

        await reply(
`⭐ *_RATE_*
━━━━━━━━━━━━━━
▸ 📌 _${textArgs}_
▸ _${bar}_
▸ ${emojis[score]} _*${score}/10*_
▸ 💬 _${comment}_
━━━━━━━━━━━━━━
◈ _Vex Bot_`);
    },
};
