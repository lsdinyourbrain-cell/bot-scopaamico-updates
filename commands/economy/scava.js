'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDarkFont } = require('../../lib/font');
const EV = require('../../lib/events');

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
            const cdMs = 45000;

            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`⏳ Scava e respira!\n▸ Riposa per ancora _${remain}s_ prima di riscavare.`)}\n${boxEnd()}`);
            }

            userData.cooldowns[cooldownKey] = now;
            const evMult = EV.isActive(db, from, 'doppioguadagno') ? 2 : 1;
            const gross = (Math.floor(Math.random() * 25) + 5) * evMult;
            const taxed = applyTax(gross, userData.money);
            userData.money += taxed.net;
            saveDB();

            const taxLine = taxed.tax > 0 ? ` (tassa ${taxed.tax}€)` : '';
            const evLine = evMult > 1 ? `\n▸ 💰 _Evento: guadagno x${evMult}_` : '';
            await sendButtons(sock, from, `${sec('MINIERA\N▸ RITR')}
${boxOpen()}
${line('Fatto!')}
${boxEnd()}`, [
                { label: `.${command}`, id: `${command}` },
            ], msg);
    },
};
