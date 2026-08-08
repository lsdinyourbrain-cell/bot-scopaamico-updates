'use strict';

module.exports = {
    name: 'memoria',
    aliases: ['simon', 'sequenza'],
    description: "Ripeti la sequenza di colori e vinci 75€.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            const cooldownKey = 'memoria';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 10000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi giocare tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            if (db[from]?.memGame?.active) {
                return reply("⏳ C'è già una sequenza da ripetere in corso!");
            }

            const COLOR_MAP = { R: '🔴', G: '🟢', B: '🔵', Y: '🟡' };
            const keys = Object.keys(COLOR_MAP);
            const sequence = Array.from({ length: 4 }, () => randomChoice(keys));

            if (!db[from]) db[from] = {};
            db[from].memGame = {
                active: true,
                sequence,
                sender,
                timestamp: Date.now(),
            };
            saveDB();

            const display = sequence.map(k => `${COLOR_MAP[k]} ${k}`).join(' ');

            await reply(
`╔════════════════════════════════╗
║       🧠 *MEMORIA!* 🧠
╠════════════════════════════════╣
║  Memorizza questa sequenza:
║
║  ${display}
║
║  ✏️ Ripetila scrivendo le
║  *lettere* (es: \`R G B Y\`)
║  ⏳ Hai 60 secondi.
╚════════════════════════════════╝`
            );

            setTimeout(() => {
                const mg = db[from]?.memGame;
                if (mg?.active && Date.now() - mg.timestamp >= 60000) {
                    mg.active = false;
                    saveDB();
                    sock.sendMessage(from, { text: `⏰ Tempo scaduto! La sequenza era *${mg.sequence.join(' ')}*.` }).catch(() => {});
                }
            }, 60000);
    },
};
