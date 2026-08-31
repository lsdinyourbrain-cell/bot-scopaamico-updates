'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'reazione',
    aliases: ['reaction', 'testreazione'],
    description: "Test di reazione: scrivi GO quando vedi il segnale e vinci 50€.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            const cooldownKey = 'reazione';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 10000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi rifare il test tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            if (db[from]?.reactionGame?.active) {
                return reply("⏳ C'è già un test di reazione in corso in questa chat!");
            }

            if (!db[from]) db[from] = {};
            db[from].reactionGame = {
                active: true,
                sender,
                phase: 'waiting',
                deadline: 0,
                timestamp: Date.now(),
            };
            saveDB();

            await reply("🧠 *_TEST DI REAZIONE_*\n\nQuando il bot manda il segnale,\nscrivi *GO* il più veloce!\n\n👀 Ti avviserò tra poco...\n");

            const delay = randomInt(3000, 7000);
            setTimeout(() => {
                const game = db[from]?.reactionGame;
                if (!game?.active || game.phase !== 'waiting') return;
                game.phase = 'go';
                game.deadline = Date.now() + 3000;
                saveDB();
                sock.sendMessage(from, { text: "⚡ *GO GO GO!*\nScrivi GO adesso! ⚡" }).catch(() => {});
                setTimeout(() => {
                    const g2 = db[from]?.reactionGame;
                    if (g2?.active && g2.phase === 'go') {
                        g2.active = false;
                        saveDB();
                        sock.sendMessage(from, { text: "⏰ *TROPPO LENTO!*\nTempo scaduto 😴" }).catch(() => {});
                    }
                }, 3000);
            }, delay);
    },
};
