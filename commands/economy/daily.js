'use strict';

module.exports = {
    name: 'daily',
    aliases: ['bonus'],
    description: "Riscuoti il bonus giornaliero.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            const userData = getUser(sender, from);
            const now = Date.now();
            const DAY_MS = 86400000;

            if (userData.lastDaily && (now - userData.lastDaily) < DAY_MS) {
                const remaining = DAY_MS - (now - userData.lastDaily);
                const hours = Math.floor(remaining / 3600000);
                const mins = Math.floor((remaining % 3600000) / 60000);
                return reply(`⏳ Hai già ritirato il daily!\n▸ Ripassa tra _${hours}h ${mins}m_.`);
            }

            const bonus = randomInt(150, 400);
            userData.money += bonus;
            userData.lastDaily = now;
            saveDB();

            await reply(
`🎁 *_DAILY_*
━━━━━━━━━━━━━━
▸ 📅 *Bonus ritirato:* _+${bonus}€_
▸ 🤑 Che giornata fortunata!
━━━━━━━━━━━━━━
▸ 💰 *Saldo:* _${userData.money}€_
◈ _Vex Bot_`);
    },
};
