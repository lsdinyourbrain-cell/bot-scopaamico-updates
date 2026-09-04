'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

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
                const t = `${sec('⏳ MEMORIA COOLDOWN')}\n${boxOpen()}\n${line(`🧠 @${dispOf(sender)} — memoria in ricarica ✨`)}\n${line(`⏳ Tra _${remain}s_ 🔮`)}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t, mentions: [sender] }, { quoted: msg });
            }
            userData.cooldowns[cooldownKey] = now;

            if (db[from]?.memGame?.active) {
                const t = `${sec('🧠 MEMORIA ATTIVA')}\n${boxOpen()}\n${line('💎 C\'è già una sequenza in corso ✨')}\n${line('🔮 _Completa quella prima di crearne un\'altra_ 💫')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
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

            const txt = `${sec('🧠 MEMORIA GLASS')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — memorizza nel vetro ✨🔮`)}\n${line('')}\n${line(`🎨 Sequenza: _${display}_ 💫`)}\n${line('')}\n${line('✏️ Ripeti le *lettere* (es: `R G B Y`) ✨')}\n${line('⏳ Hai _60 secondi_ • vetro cromato 💎')}\n${boxEnd()}`;
            await sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });

            setTimeout(() => {
                const mg = db[from]?.memGame;
                if (mg?.active && Date.now() - mg.timestamp >= 60000) {
                    mg.active = false;
                    saveDB();
                    sock.sendMessage(from, { text: `${sec('⏰ TEMPO SCADUTO')}\n${boxOpen()}\n${line(`💎 Sequenza: _${mg.sequence.join(' ')}_ ✨`)}\n${line('🔮 _Vetro dissolto..._ 💫')}\n${boxEnd()}` }).catch(() => {});
                }
            }, 60000);
    },
};
