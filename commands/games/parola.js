'use strict';

module.exports = {
    name: 'parola',
    aliases: ['indovinaparola', 'impiccato', 'hangman'],
    description: "Indovina la parola lettera per lettera e vinci 100€.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            const cooldownKey = 'parola';
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

            if (db[from]?.wordGame?.active) {
                return reply("⏳ C'è già una partita di parola in corso! Scrivi una lettera o la parola intera.");
            }

            const WORDS = [
                'casa', 'cane', 'gatto', 'sole', 'luna', 'mare', 'monte', 'pane',
                'vino', 'acqua', 'fuoco', 'terra', 'vento', 'treno', 'libro',
                'penna', 'scuola', 'gioco', 'pizza', 'pasta', 'caffe', 'amico',
                'stella', 'notte', 'giorno', 'tempo', 'cuore', 'anima', 'felice', 'sorriso',
            ];

            const word = randomChoice(WORDS);

            if (!db[from]) db[from] = {};
            db[from].wordGame = {
                active: true,
                word,
                wrong: 0,
                guessed: [],
                sender,
                timestamp: Date.now(),
            };
            saveDB();

            const mask = (wg) => wg.word.split('').map(ch => wg.guessed.includes(ch) ? ch : ' _ ').join('');

            await reply(
`╔════════════════════════════════╗
║     🧩 *INDOVINA LA PAROLA* 🧩
╠════════════════════════════════╣
║  ${mask(db[from].wordGame)}
║
║  ✏️ Scrivi una *lettera* o la
║  *parola intera*!
║  ⏳ 90 secondi · 6 errori = fine.
╚════════════════════════════════╝`
            );

            setTimeout(() => {
                const wg = db[from]?.wordGame;
                if (wg?.active && Date.now() - wg.timestamp >= 90000) {
                    wg.active = false;
                    saveDB();
                    sock.sendMessage(from, { text: `╔════════════════════════════════╗\n║       ⏰ *TEMPO SCADUTO* ⏰\n╠════════════════════════════════╣\n║  La parola era: *${wg.word}*\n╚════════════════════════════════╝` }).catch(() => {});
                }
            }, 90000);
    },
};
