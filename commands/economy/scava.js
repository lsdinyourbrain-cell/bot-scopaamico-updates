'use strict';

module.exports = {
    name: 'scava',
    aliases: [],
    description: "Scava per guadagnare soldi.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons, applyTax } = services;


            const cooldownKey = 'scava';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 30000;

            if (!isButton && now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Scava e respira!\n▸ Riposa per ancora _${remain}s_ prima di riscavare.`);
            }

            userData.cooldowns[cooldownKey] = now;
            const gross = Math.floor(Math.random() * 50) + 10;
            const taxed = applyTax(gross, userData.money);
            userData.money += taxed.net;
            saveDB();

            const taxLine = taxed.tax > 0
                ? `\n▸ 🏛️ *Tassa:* _-${taxed.tax}€_ (${taxed.rate}%)`
                : '';
            await sendButtons(sock, from, `╔════════════════════╗\n▸ ⛏️ *_MINIERA_*\n╚════════════════════╝\n▸ 💰 *Ritrovato:* _${gross}€_\n▸ 💳 *Per te:* _+${taxed.net}€_${taxLine}\n▸ 💵 *Saldo:* _${userData.money}€_\n◈ _Vex Bot_`, [
                { label: `.${command}`, id: `${command}` },
            ], msg);
    },
};
