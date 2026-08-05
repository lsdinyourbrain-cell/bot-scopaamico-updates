'use strict';

module.exports = {
    name: 'indovina',
    aliases: ['indovinanumero'],
    description: "Indovina il numero segreto (1-10) e vinci 3x la puntata.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const cooldownKey = 'indovina';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 5000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi giocare tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            const guess = parseInt(args[0]);
            if (isNaN(guess) || guess < 1 || guess > 10) {
                return reply("⚠️ Indovina un numero tra 1 e 10.\n👉 *Uso:* `.indovina 7`");
            }

            const puntata = parseInt(args[1]) || 20;
            const uDB = getUser(sender, from);
            if (puntata < 1) return reply("⚠️ Puntata non valida.");
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

            const secret = randomInt(1, 10);
            let esito;
            if (guess === secret) {
                uDB.money += puntata * 2;
                esito = `🎉 *NUMERO GIUSTO!* +${formatMoney(puntata * 2)}`;
            } else {
                uDB.money -= puntata;
                esito = `😅 Era il *${secret}*. Hai perso ${formatMoney(puntata)}.`;
            }

            saveDB();

            const resultText =
`╭────〔 🎯 *INDOVINA* 〕─────╮
│ 🔢 Hai scelto: *${guess}*
│ 🕵️ Numero segreto: *${secret}*
├──────────────────────────────
│ ${esito}
│ 💰 *Saldo attuale:* ${formatMoney(uDB.money)}
╰──────────────────────────────╯`;
            await sendButtons(sock, from, resultText, [
                { label: '🔁 Gioca ancora', id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
