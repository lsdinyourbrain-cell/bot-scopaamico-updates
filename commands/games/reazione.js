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
                return reply(`${sec('ATTESA')}\n${boxOpen()}\n${line(`⏳ Calma! Puoi rifare il test tra *${remain}s*.`)}\n${boxEnd()}`);
            }
            userData.cooldowns[cooldownKey] = now;

            if (db[from]?.reactionGame?.active) {
                return reply(`${sec('REAZIONE')}\n${boxOpen()}\n${line("⏳ C'è già un test di reazione in corso in questa chat!")}\n${boxEnd()}`);
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

            await reply(`${sec('TEST DI REAZIONE')}\n${boxOpen()}\n${line('Quando il bot manda il segnale,')}\n${line('scrivi *GO* il più veloce!')}\n${line('')}\n${line('👀 Ti avviserò tra poco...')}\n${boxEnd()}`);

            const delay = randomInt(3000, 7000);
            setTimeout(() => {
                const game = db[from]?.reactionGame;
                if (!game?.active || game.phase !== 'waiting') return;
                game.phase = 'go';
                game.deadline = Date.now() + 3000;
                saveDB();
                sock.sendMessage(from, { text: `${sec('GO')}\n${boxOpen()}\n${line('⚡ GO GO GO! Scrivi GO adesso! ⚡')}\n${boxEnd()}` }).catch(() => {});
                setTimeout(() => {
                    const g2 = db[from]?.reactionGame;
                    if (g2?.active && g2.phase === 'go') {
                        g2.active = false;
                        saveDB();
                        sock.sendMessage(from, { text: `${sec('TROPPO LENTO')}\n${boxOpen()}\n${line('⏰ Tempo scaduto 😴')}\n${boxEnd()}` }).catch(() => {});
                    }
                }, 3000);
            }, delay);
    },
};
