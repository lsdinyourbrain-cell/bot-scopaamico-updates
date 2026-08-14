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
                return reply("⚠️ _[uso]: .roulette <importo>_ — es. _.roulette 50_");
            }
            const uDB = getUser(sender, from);
            if (uDB.money < puntata) return reply(`❌ Ti mancano soldi: hai _${formatMoney(uDB.money)}_.`);

            const win = Math.random() < 0.44;
            uDB.money += win ? puntata : -puntata;
            saveDB();

            const resultText =
`🎡 *_ROULETTE_*
━━━━━━━━━━━━━━
▸ 💸 Puntata: _${formatMoney(puntata)}_
▸ ${win ? '✨ È uscito il tuo numero!' : '🫠 Giro storto, andata male.'}
━━━━━━━━━━━━━━
▸ 💰 Saldo: _${formatMoney(uDB.money)}_
◈ _Vex Bot_`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
