'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

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
            if (isNaN(puntata) || puntata <= 0) {
                const t = `${sec('🎲 DADI GLASS')}\n${boxOpen()}\n${line('💎 Uso: *.dadi <importo>* ✨')}\n${line('💫 Esempio: _.dadi 50_ 🔮')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            if (puntata > 1_000_000) {
                const t = `${sec('🎲 DADI')}\n${boxOpen()}\n${line('💎 Puntata max _1.000.000€_ ✨')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }

            const uDB = getUser(sender, from);
            if (uDB.money < puntata) {
                const t = `${sec('💸 FONDI INSUFFICIENTI')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — hai _${uDB.money}€_ 💫`)}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t, mentions: [sender] }, { quoted: msg });
            }

            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 5000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                const t = `${sec('⏳ DADI COOLDOWN')}\n${boxOpen()}\n${line(`🎲 @${dispOf(sender)} — dadi in ricarica ✨`)}\n${line(`⏳ Tra _${remain}s_ 🔮`)}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t, mentions: [sender] }, { quoted: msg });
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
            const extraRiccoDadi = uDB.money > 5000 ? line(`💫 _${frasiIronicheDadi[Math.floor(Math.random()*frasiIronicheDadi.length)]}_`) : '';

            const resultText = `${sec('🎲 DADI GLASS')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — lancio vetro ✨🔮`)}\n${line(`🧑 Tu: _${userRoll}_ 🎲  •  🤖 Bot: _${botRoll}_ 💎`)}\n${line(`${esito} 💫`)}\n${extraRiccoDadi ? extraRiccoDadi+'\n' : ''}${line(`💳 Saldo: _${uDB.money}€_ • 🎲 glass roll`)}\n${boxEnd()}`;
            await sendButtons(sock, from, resultText, [
                { label: `🎲 Rilancia ${puntata} ✨`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
