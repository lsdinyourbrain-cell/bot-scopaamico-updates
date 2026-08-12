'use strict';

module.exports = {
    name: 'indovina',
    aliases: ['indovinanumero'],
    description: "Indovina il numero segreto e vinci. Difficoltà opzionale: facile (1-5), media (1-10), difficile (1-20). Uso: .indovina [difficoltà] numero puntata",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const cooldownKey = 'indovina';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 5000;
            if (!isButton && now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi giocare tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            // Difficoltà opzionale come primo argomento: cambia l'intervallo del numero
            // e il moltiplicatore della vincita. Default = media (1-10).
            const DIFFS = {
                facile:    { max: 5, mult: 3 },
                media:     { max: 10, mult: 2 },
                difficile: { max: 20, mult: 4 },
            };
            const dKey = String(args[0] || '').toLowerCase();
            const diff = DIFFS[dKey];
            const off = diff ? 1 : 0;
            const D = diff || DIFFS.media;

            const guess = parseInt(args[off]);
            if (isNaN(guess) || guess < 1 || guess > D.max) {
                return reply(`⚠️ Indovina un numero tra 1 e *${D.max}*.\n👉 *Uso:* \`.indovina ${diff ? dKey + ' ' : ''}7\`\nDifficoltà: *facile* (1-5),\n*media* (1-10), *difficile* (1-20).`);
            }

            const puntata = parseInt(args[off + 1]) || 20;
            const uDB = getUser(sender, from);
            if (puntata < 1) return reply("⚠️ Puntata non valida.");
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

            const secret = randomInt(1, D.max);
            let esito;
            if (guess === secret) {
                uDB.money += puntata * D.mult;
                esito = `🎉 *NUMERO GIUSTO!* +${formatMoney(puntata * D.mult)}`;
            } else {
                uDB.money -= puntata;
                esito = `😅 Era il *${secret}*. Hai perso ${formatMoney(puntata)}.`;
            }

            saveDB();

            const resultText =
`🎯 *INDOVINA*
━━━━━━━━━━━━━━━━━━
🎚️ Difficoltà: ${D.max <= 5 ? '🟢 Facile (1-5)' : D.max <= 10 ? '🟡 Media (1-10)' : '🔴 Difficile (1-20)'}
🔢 Hai scelto: *${guess}*
🕵️ Numero segreto: *${secret}*

${esito}
💰 Saldo attuale: *${formatMoney(uDB.money)}*
━━━━━━━━━━━━━━━━━━`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
