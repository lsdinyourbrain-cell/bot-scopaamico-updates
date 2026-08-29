'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'spegni',
    aliases: [],
    description: "Spegne il bot globalmente (owner) o solo nel gruppo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

        if (isGroup && isSenderAdmin && !isOwner) {
            if (!db[from]) db[from] = {};
            db[from]._muted = true;
            saveDB();
            return sendButtons(sock, from,
`⏸️ *_BOT IN PAUSA_*
▸ Il bot è stato disattivato
  in questo gruppo
  da un amministratore.
▸ Premi il pulsante per
  riattivarlo.
`,
                [{ label: '.accendi', id: 'accendi' }],
                msg);
        }

        if (!isOwner) return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);

        setBotActive(false);
        await reply("⚙️ *_SISTEMA_*\n━━━━━━━━━━━━━━━━━━\n▸ 🛑 Bot in modalità\n  _SOSPENSIONE_.\n▸ Non risponderò a nessuno,\n  tranne che all'Owner.\n━━━━━━━━━━━━━━━━━━\n");
    },
};
