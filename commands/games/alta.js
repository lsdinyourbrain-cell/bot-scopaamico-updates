'use strict';

module.exports = {
    name: 'alta',
    aliases: ['altabassa'],
    description: "Indovina se la prossima carta sarà più alta o più bassa.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const cooldownKey = 'alta';
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

            const scelta = String(args[0] || '').toLowerCase();
            const puntata = parseInt(args[1]) || 20;
            const uDB = getUser(sender, from);
            if (puntata < 1) return reply("⚠️ Puntata non valida.");
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

            const picked = scelta === 'alta' ? 'alta' : scelta === 'bassa' ? 'bassa' : scelta === 'a' ? 'alta' : scelta === 'b' ? 'bassa' : null;
            if (!picked) {
                return reply("⚠️ Scegli *alta* o *bassa*.\n👉 *Uso:* `.alta alta 50` oppure `.alta bassa 50`");
            }

            const symbols = { 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
            const cardOne = randomInt(2, 14);
            const cardTwo = randomInt(2, 14);

            let esito;
            if (cardTwo > cardOne) {
                if (picked === 'alta') { uDB.money += puntata; esito = `✅ *HAI VINTO!* +${formatMoney(puntata)}`; }
                else { uDB.money -= puntata; esito = `❌ *HAI PERSO!* -${formatMoney(puntata)}`; }
            } else if (cardTwo < cardOne) {
                if (picked === 'bassa') { uDB.money += puntata; esito = `✅ *HAI VINTO!* +${formatMoney(puntata)}`; }
                else { uDB.money -= puntata; esito = `❌ *HAI PERSO!* -${formatMoney(puntata)}`; }
            } else {
                esito = `🤝 *PAREGGIO!* (0€)`;
            }

            saveDB();

            const resultText =
`🃏 *ALTA O BASSA*
━━━━━━━━━━━━━━━━━━
🎴 Carta mostrata: *${symbols[cardOne]}*
🎴 Carta successiva: *${symbols[cardTwo]}*
🧑 Avevi detto: *${picked}*

${esito}
💰 Saldo attuale: *${formatMoney(uDB.money)}*
━━━━━━━━━━━━━━━━━━`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
