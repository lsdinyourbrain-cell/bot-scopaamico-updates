'use strict';

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
            if (!isButton && now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi giocare tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            const puntata = parseInt(args[0]) || 20;
            const uDB = getUser(sender, from);
            if (puntata < 1) return reply("⚠️ Puntata non valida.");
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

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

            let esito;
            if (playerTotal > 21) {
                uDB.money -= puntata;
                esito = `💥 *SBALLATO!* -${formatMoney(puntata)}`;
            } else if (dealerTotal > 21) {
                uDB.money += puntata;
                esito = `🎉 *Il bot sballa!* +${formatMoney(puntata)}`;
            } else if (playerTotal > dealerTotal) {
                if (playerTotal === 21) {
                    uDB.money += Math.round(puntata * 1.5);
                    esito = `🌟 *BLACKJACK!* +${formatMoney(Math.round(puntata * 1.5))}`;
                } else {
                    uDB.money += puntata;
                    esito = `✅ *HAI VINTO!* +${formatMoney(puntata)}`;
                }
            } else if (playerTotal < dealerTotal) {
                uDB.money -= puntata;
                esito = `❌ *HAI PERSO!* -${formatMoney(puntata)}`;
            } else {
                esito = `🤝 *PAREGGIO!* (0€)`;
            }

            saveDB();

            const resultText =
`╭────〔 🃏 *BLACKJACK* 〕─────╮
│ 🧑 Le tue carte: ${playerCards.join(' | ')}
│ 🧮 Il tuo totale: *${playerTotal}*
│ 🤖 Carte bot: ${dealerCards.join(' | ')}
│ 🧮 Totale bot: *${dealerTotal}*
├──────────────────────────────
│ ${esito}
│ 💰 *Saldo attuale:* ${formatMoney(uDB.money)}
╰──────────────────────────────╯`;
            await sendButtons(sock, from, resultText, [
                { label: `🔁 .${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
