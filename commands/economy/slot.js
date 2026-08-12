'use strict';

module.exports = {
    name: 'slot',
    aliases: [],
    description: "Esegue il comando .slot.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            const puntata = 20;
            const uDB     = getUser(sender, from);
            if (uDB.money < puntata) return reply(`❌ Costa *${puntata}€* girare la slot. Saldo attuale: *${uDB.money}€*.`);

            uDB.money -= puntata;
            const icone = ['🍒', '🍋', '🔔', '💎', '🍉'];
            const r     = [0, 1, 2].map(() => icone[Math.floor(Math.random() * icone.length)]);

            let win = 0;
            if (r[0] === r[1] && r[1] === r[2]) win = 200;
            else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) win = 30;

            uDB.money += win;
            saveDB();

            const risultato = win > 0 ? `🎊 *HAI VINTO ${win}€!* 🎊` : `💀 *HAI PERSO ${puntata}€*`;

            const resultText =
`🎰 *SLOT MACHINE*
━━━━━━━━━━━━━━━━━━
[ ${r[0]} | ${r[1]} | ${r[2]} ]

${risultato}
💰 Saldo attuale: *${uDB.money}€*
━━━━━━━━━━━━━━━━━━`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
