'use strict';

const EV = require('../../lib/events');

module.exports = {
    name: 'dadi',
    aliases: [],
    description: "Lancia i dadi scommettendo soldi.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const cooldownKey = 'dadi';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};

            const puntata = parseInt(args[0]);
            if (isNaN(puntata) || puntata <= 0) return reply("⚠️ _[uso]: .dadi <importo>_ — es. _.dadi 50_");
            if (puntata > 1_000_000) return reply("⚠️ Puntata massima: *1.000.000€*.");

            const uDB = getUser(sender, from);
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 5000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi lanciare i dadi tra _${remain}s_.`);
            }
            userData.cooldowns[cooldownKey] = now;

            const userRoll = Math.floor(Math.random() * 6) + 1;
            const botRoll  = Math.floor(Math.random() * 6) + 1;

            const evMult = EV.isActive(db, from, 'slotoro') ? 3 : 1;
            let esito;
            if (userRoll > botRoll) {
                const payout = Math.floor(puntata * 0.95 * evMult);
                uDB.money += payout;
                esito = `✅ *HAI VINTO!* (+${payout}€)${evMult > 1 ? ' 🎰x3' : ''}`;
            } else if (userRoll < botRoll) {
                uDB.money -= puntata;
                esito = `❌ *HAI PERSO!* (-${puntata}€)`;
            } else {
                esito = `🤝 *PAREGGIO!* (0€)`;
            }

            saveDB();

            const frasiIronicheDadi = [
                "Sei il Robin Hood del gruppo, rubi ai poveri per dare a te stesso 😏",
                "Hai le mani più veloci di un borseggiatore a Napoli 🏃‍♂️",
                "A questo punto potresti comprare il gruppo... o rapinarlo direttamente 🏦💰",
                "Sei così ricco che i dadi ti pagano l'affitto 😂",
                "Hai più soldi di Paperone, ma continui a lanciare dadi come un ragazzino 🦆💸",
                "Attento, con tutto quel malloppo la Finanza ti sta già cercando 🕵️‍♂️"
            ];
            const extraRiccoDadi = uDB.money > 5000 ? `\n▸ _${frasiIronicheDadi[Math.floor(Math.random()*frasiIronicheDadi.length)]}_` : '';

            const resultText =
`🎲 *_LANCIO DADI_*
━━━━━━━━━━━━━━
▸ 🧑 Tu: _${userRoll}_
▸ 🤖 Bot: _${botRoll}_
━━━━━━━━━━━━━━
▸ ${esito}${extraRiccoDadi}
▸ 💰 Saldo attuale: _${uDB.money}€_
◈ _Vex Bot_`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
