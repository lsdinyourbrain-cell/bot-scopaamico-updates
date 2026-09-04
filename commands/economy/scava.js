'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
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
                const txt = `${sec('⛏️ SCAVA COOLDOWN')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — piccone in ricarica ✨`)}\n${line(`🔮 _Vetro minerario in pausa..._`)}\n${line('')}\n${line(`⏳ Riposa _${remain}s_ poi riscava 💫`)}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
            }

            userData.cooldowns[cooldownKey] = now;
            const evMult = EV.isActive(db, from, 'doppioguadagno') ? 2 : 1;
            const gross = (Math.floor(Math.random() * 25) + 5) * evMult;
            const taxed = applyTax(gross, userData.money);
            userData.money += taxed.net;
            saveDB();

            const taxLine = taxed.tax > 0 ? ` • _tassa ${taxed.tax}€_ 🔹` : '';
            const gems = ['💎','🔮','✨','⛏️','🌟'][Math.floor(Math.random()*5)];
            const txt2 = `${sec('⛏️ MINIERA GLASS')}\n${boxOpen()}\n${line(`${gems} @${dispOf(sender)} — *SCAVO RIUSCITO* 💎`)}\n${line(`🔮 _Cristalli estratti nel vetro_`)}\n${line('')}\n${line(`⛏️ Lordo: _+${gross}€_ → Netto: _+${taxed.net}€_${taxLine}`)}\n${evMult>1 ? line(`💰 Evento _x${evMult}_ 💫`) : line(`✨ Scavo brillante!`)}\n${line(`💳 Saldo: _${userData.money}€_ • ⛏️ continua!`)}\n${boxEnd()}`;
            await sendButtons(sock, from, toDarkFont(txt2), [
                { label: `⛏️ Scava ancora ✨`, id: `${command}` },
            ], msg);
    },
};
