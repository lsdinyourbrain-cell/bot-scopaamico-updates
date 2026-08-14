'use strict';

module.exports = {
    name: 'testa',
    aliases: ['testacroce', 'testaocroce'],
    description: "Scommetti su testa o croce e raddoppia la puntata.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const cooldownKey = 'testa';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 5000;
            if (!isButton && now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi lanciare la moneta tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            const scelta = String(args[0] || '').toLowerCase();
            const puntata = parseInt(args[1]) || 20;
            const uDB = getUser(sender, from);
            if (puntata < 1) return reply("⚠️ Puntata non valida.");
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

            const valid = {
                t: 'testa', testa: 'testa', 'testa': 'testa', c: 'croce', croce: 'croce',
                teso: 'testa', cr: 'croce',
            };
            const picked = valid[scelta];
            if (!picked) {
                return reply("⚠️ _[uso]: scegli *testa* o *croce* — .testa testa 50 oppure .testa croce 50_");
            }

            const flip = randomChoice(['testa', 'croce']);
            let esito;
            if (picked === flip) {
                uDB.money += puntata;
                esito = `✅ *HAI VINTO!* +${formatMoney(puntata)}`;
            } else {
                uDB.money -= puntata;
                esito = `❌ *HAI PERSO!* -${formatMoney(puntata)}`;
            }

            saveDB();

            const resultText =
`🪙 *_TESTA O CROCE_*
━━━━━━━━━━━━━━
▸ *Hai scelto:* _${picked}_
▸ *Risultato:* _${flip}_

${esito}
▸ *Saldo attuale:* _${formatMoney(uDB.money)}_
◈ _Vex Bot_`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
