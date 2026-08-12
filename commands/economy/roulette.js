'use strict';

module.exports = {
    name: 'roulette',
    aliases: [],
    description: "Esegue il comando .roulette.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            const puntata = Number.parseInt(args[0], 10);
            if (!Number.isInteger(puntata) || puntata <= 0) {
                return reply("Scegli una puntata valida. Esempio: .roulette 50");
            }
            const uDB = getUser(sender, from);
            if (uDB.money < puntata) return reply(`Ti mancano soldi: hai ${formatMoney(uDB.money)}.`);

            const win = Math.random() < 0.44;
            uDB.money += win ? puntata : -puntata;
            saveDB();

            const resultText =
`🎡 *ROULETTE*
━━━━━━━━━━━━━━━━━━
Puntata: *${formatMoney(puntata)}*
${win ? '✨ È uscito il tuo numero!' : '🫠 Giro storto, andata male.'}
Saldo: *${formatMoney(uDB.money)}*
━━━━━━━━━━━━━━━━━━`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
