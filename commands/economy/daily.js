'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

const EV = require('../../lib/events');

module.exports = {
    name: 'daily',
    aliases: ['bonus'],
    description: "Riscuoti il bonus giornaliero.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, applyTax } = services;


            const userData = getUser(sender, from);
            const now = Date.now();
            const DAY_MS = 86400000;

            if (userData.lastDaily && (now - userData.lastDaily) < DAY_MS) {
                const remaining = DAY_MS - (now - userData.lastDaily);
                const hours = Math.floor(remaining / 3600000);
                const mins = Math.floor((remaining % 3600000) / 60000);
                const txt = `${sec('⏳ DAILY COOLDOWN')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — hai già riscosso oggi ✨`)}\n${line(`🔮 _Vetro in ricarica..._`)}\n${line('')}\n${line(`⏰ Ripassa tra _${hours}h ${mins}m_ 💫`)}\n${line(`💰 Saldo: _${userData.money}€_`)}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
            }

            const evMult = EV.isActive(db, from, 'doppioguadagno') ? 2 : 1;
            const grossBonus = randomInt(50, 180) * evMult;
            const taxed = applyTax(grossBonus, userData.money);
            userData.money += taxed.net;
            userData.lastDaily = now;
            saveDB();

            const taxLine = taxed.tax > 0 ? ` • _tassa ${taxed.tax}€_ 🔹` : '';
            const txt2 = `${sec('🎁 DAILY PREMIUM')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — *BONUS GIORNALIERO* ✨🔮`)}\n${line(`🌟 _Vetro diamantato sprigionato_`)}\n${line('')}\n${line(`🎁 Lordo: _+${grossBonus}€_ → Netto: _+${taxed.net}€_${taxLine}`)}\n${evMult > 1 ? line(`💰 Evento attivo _x${evMult}_ 💫`) : line(`✨ Bonus base riscattato`)}\n${line(`💳 Saldo: _${userData.money}€_ • 💫 glass effect`)}\n${boxEnd()}`;
            await sock.sendMessage(from, { text: txt2, mentions: [sender] }, { quoted: msg });
    },
};
