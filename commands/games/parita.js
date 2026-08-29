'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'parita',
    aliases: ['paridispar', 'paridos', 'pariodispari'],
    description: "Scommetti su pari o dispari con un lancio di dado.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const cooldownKey = 'parita';
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

            const scelta = String(args[0] || '').toLowerCase();
            const puntata = parseInt(args[1]) || 20;
            const uDB = getUser(sender, from);
            if (puntata < 1) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Puntata non valida.')}
${boxEnd()}`);
            if (puntata > 1_000_000) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Puntata massima: *1.000.000€*.')}
${boxEnd()}`);
            if (uDB.money < puntata) return reply("❌ Saldo insufficiente.");

            const valid = {
                p: 'pari', pari: 'pari', d: 'dispari', dispari: 'dispari', dis: 'dispari',
            };
            const picked = valid[scelta];
            if (!picked) {
                return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: scegli *pari* o *dispari* — .parita pari 50 oppure .parita dispari 50')}
${boxEnd()}`);
            }

            const roll = randomInt(1, 6);
            const isEven = roll % 2 === 0;
            const result = isEven ? 'pari' : 'dispari';

            let esito;
            if (picked === result) {
                uDB.money += puntata;
                esito = `✅ *HAI VINTO!* +${formatMoney(puntata)}`;
            } else {
                uDB.money -= puntata;
                esito = `❌ *HAI PERSO!* -${formatMoney(puntata)}`;
            }

            saveDB();

            const resultText =
`🎲 *_PARI O DISPARI_*
▸ *Hai scelto:* _${picked}_
▸ *Dado uscito:* _${roll} (${result})_

${esito}
▸ *Saldo attuale:* _${formatMoney(uDB.money)}_
`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
