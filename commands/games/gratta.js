'use strict';

const EV = require('../../lib/events');

module.exports = {
    name: 'gratta',
    aliases: ['grattaevinci'],
    description: "Gratta e vinci: 9 caselle, allinea 3 simboli e vinci!",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const cooldownKey = 'gratta';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 8000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi grattare tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            const cost = 15;
            const uDB = getUser(sender, from);
            if (uDB.money < cost) return reply("❌ Servono 15€ per un gratta e vinci.");

            const symbols = ['🍒', '🍋', '🍇', '⭐', '💎', '🎰'];
            const prizes = { '🍒': 20, '🍋': 25, '🍇': 35, '⭐': 45, '💎': 60, '🎰': 100 };
            const grid = Array.from({ length: 9 }, () => randomChoice(symbols));

            const lines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6],
            ];

            let winLine = null;
            for (const line of lines) {
                const [a, b, c] = line;
                if (grid[a] === grid[b] && grid[b] === grid[c]) {
                    winLine = line;
                    break;
                }
            }

            let esito;
            if (winLine) {
                const prize = prizes[grid[winLine[0]]] * (EV.isActive(db, from, 'slotoro') ? 3 : 1);
                uDB.money += prize - cost;
                esito = `🎉 *TRIS DI ${grid[winLine[0]]}!* Vinci ${formatMoney(prize)}!${prize > prizes[grid[winLine[0]]] ? ' 🎰x3' : ''}`;
            } else {
                uDB.money -= cost;
                esito = `😞 Niente tris questa volta.\nHai speso ${formatMoney(cost)}.`;
            }

            const render = (grid) => {
                return `${grid[0]} ${grid[1]} ${grid[2]}\n${grid[3]} ${grid[4]} ${grid[5]}\n${grid[6]} ${grid[7]} ${grid[8]}`;
            };

            saveDB();

            const resultText =
`🎟️ *_GRATTA E VINCI_*
━━━━━━━━━━━━━━
${render(grid)}

${esito}
▸ *Saldo attuale:* _${formatMoney(uDB.money)}_
◈ _Vex Bot_`;
            await sendButtons(sock, from, resultText, [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
