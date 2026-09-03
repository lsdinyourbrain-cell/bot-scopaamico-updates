'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const EV = require('../../lib/events');

module.exports = {
    name: 'blackjack',
    aliases: ['bj', 'ventuno', '21'],
    description: "Gioca a 21 contro il bot (dai un'eventuale carta con 'hit').",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const cooldownKey = 'blackjack';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 8000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                const t = `${sec('⏳ BLACKJACK COOLDOWN')}\n${boxOpen()}\n${line(`🃏 @${sender.split('@')[0]} — mazzo in ricarica ✨`)}\n${line(`⏳ Tra _${remain}s_ 🔮`)}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t, mentions: [sender] }, { quoted: msg });
            }
            userData.cooldowns[cooldownKey] = now;

            const puntata = parseInt(args[0]) || 20;
            const uDB = getUser(sender, from);
            if (puntata < 1) {
                const t = `${sec('🃏 BLACKJACK')}\n${boxOpen()}\n${line('💎 Puntata non valida ✨')}\n${line('💫 Esempio: _.blackjack 50_ 🔮')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            if (puntata > 1_000_000) {
                const t = `${sec('🃏 BLACKJACK')}\n${boxOpen()}\n${line('💎 Puntata max _1.000.000€_ ✨')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            if (uDB.money < puntata) {
                const t = `${sec('💸 FONDI INSUFFICIENTI')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — hai _${uDB.money}€_ 💫`)}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t, mentions: [sender] }, { quoted: msg });
            }

            const draw = () => randomInt(2, 11);
            const hit = String(args[1] || '').toLowerCase() === 'hit' || String(args[1] || '').toLowerCase() === 'carta';

            let playerCards = [draw(), draw()];
            let playerTotal = playerCards.reduce((a, b) => a + b, 0);
            let extraCard = null;

            if (hit && playerTotal <= 21) {
                extraCard = draw();
                playerCards.push(extraCard);
                playerTotal += extraCard;
            }

            let dealerCards = [draw(), draw()];
            let dealerTotal = dealerCards.reduce((a, b) => a + b, 0);
            while (dealerTotal < 17) {
                const c = draw();
                dealerCards.push(c);
                dealerTotal += c;
            }

            const evMult = EV.isActive(db, from, 'slotoro') ? 3 : 1;
            let esito;
            if (playerTotal > 21) {
                uDB.money -= puntata;
                esito = `💥 *SBALLATO!* -${formatMoney(puntata)}`;
            } else if (dealerTotal > 21) {
                uDB.money += puntata * evMult;
                esito = `🎉 *Il bot sballa!* +${formatMoney(puntata * evMult)}${evMult > 1 ? ' 🎰x3' : ''}`;
            } else if (playerTotal > dealerTotal) {
                if (playerTotal === 21) {
                    uDB.money += Math.round(puntata * 1.5) * evMult;
                    esito = `🌟 *BLACKJACK!* +${formatMoney(Math.round(puntata * 1.5) * evMult)}${evMult > 1 ? ' 🎰x3' : ''}`;
                } else {
                    uDB.money += puntata * evMult;
                    esito = `✅ *HAI VINTO!* +${formatMoney(puntata * evMult)}${evMult > 1 ? ' 🎰x3' : ''}`;
                }
            } else if (playerTotal < dealerTotal) {
                uDB.money -= puntata;
                esito = `❌ *HAI PERSO!* -${formatMoney(puntata)}`;
            } else {
                esito = `🤝 *PAREGGIO!* (0€)`;
            }

            saveDB();

            const resultText = `${sec('🃏 BLACKJACK GLASS')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — *TAVOLO VETRO* ✨🔮`)}\n${line(`🃏 Tue: _${playerCards.join(' • ')}_ → _${playerTotal}_ 💫`)}\n${line(`🤖 Bot: _${dealerCards.join(' • ')}_ → _${dealerTotal}_ 💎`)}\n${line('')}\n${line(`${esito} ✨`)}\n${line(`💳 Saldo: _${formatMoney(uDB.money)}_ • 🃏 glass`)}\n${boxEnd()}`;
            await sendButtons(sock, from, resultText, [
                { label: `🃏 Rigioca ${puntata} ✨`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
