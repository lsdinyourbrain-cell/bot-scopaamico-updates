'use strict';

const EV = require('../../lib/events');

module.exports = {
    name: 'ruota',
    aliases: ['ruotafortuna', 'ruotadellafortuna'],
    description: "Fai girare la ruota della fortuna e vinci moltiplicatori.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const cooldownKey = 'ruota';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 8000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! La ruota sta ancora girando. Riprova tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            const puntata = parseInt(args[0]) || 20;
            const uDB = getUser(sender, from);
            if (puntata < 1) return reply("⚠️ Puntata non valida.");
            if (puntata > 1_000_000) return reply("⚠️ Puntata massima: *1.000.000€*.");
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

            const sectors = [
                { name: 'PERDONA', mult: 0, emoji: '💸' },
                { name: 'PERDONA', mult: 0, emoji: '💸' },
                { name: 'x0.5', mult: 0.5, emoji: '😬' },
                { name: 'x1', mult: 1, emoji: '😐' },
                { name: 'x1', mult: 1, emoji: '😐' },
                { name: 'x1.5', mult: 1.5, emoji: '🙂' },
                { name: 'x2', mult: 2, emoji: '💰' },
                { name: 'PERDONA', mult: 0, emoji: '💸' },
                { name: 'x2.5', mult: 2.5, emoji: '😍' },
                { name: 'x3', mult: 3, emoji: '🤑' },
                { name: 'PERDONA', mult: 0, emoji: '💸' },
                { name: 'PERDONA', mult: 0, emoji: '💸' },
            ];

            const win = randomChoice(sectors);
            const evMult = EV.isActive(db, from, 'slotoro') ? 3 : 1;
            const amount = Math.round(puntata * win.mult * evMult);

            let esito;
            if (win.mult === 0) {
                uDB.money -= puntata;
                esito = `💸 *PERDONA TUTTO!*\nHai perso ${formatMoney(puntata)}.`;
            } else if (win.mult < 1) {
                const lose = Math.round(puntata * (1 - win.mult));
                uDB.money -= lose;
                esito = `😬 *${win.name}* Hai perso ${formatMoney(lose)}.`;
            } else if (win.mult === 1) {
                esito = `😐 *x1* Non vinci né perdi.`;
            } else {
                uDB.money += amount;
                esito = `${win.emoji} *${win.name}!* Hai vinto ${formatMoney(amount)}${evMult > 1 ? ' (x3 slotoro 🎰)' : ''}.`;
            }

            saveDB();

            const resultText =
`🎡 *_RUOTA DELLA FORTUNA_*
━━━━━━━━━━━━━━
🎡 La ruota gira...
▸ *Settore:* _${win.name}_ ${win.emoji}

${esito}
▸ *Saldo attuale:* _${formatMoney(uDB.money)}_
◈ _Vex Bot_`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
