'use strict';

module.exports = {
    name: 'rissa',
    aliases: [],
    description: "Esegue il comando .rissa.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!targetJid) return reply("Tagga qualcuno con cui fare a botte. Esempio: .rissa @nome");
            const vincitore  = Math.random() > 0.5 ? sender : targetJid;
            const perdente   = vincitore === sender ? targetJid : sender;
            // Sostituisce i placeholder X/Y con i nomi reali
            const frase = randomChoice(ARRAYS.rissa)
                .replace(/X/g, `@${vincitore.split('@')[0]}`)
                .replace(/Y/g, `@${perdente.split('@')[0]}`);
            await sock.sendMessage(from, {
                text: `🥊 *RISSA*\n━━━━━━━━━━━━━━━━━━\n⚔️ @${sender.split('@')[0]} vs\n@${targetJid.split('@')[0]}\n_💬 ${frase}_\n🏆 Vincitore: @${vincitore.split('@')[0]}\n━━━━━━━━━━━━━━━━━━`,
                mentions: [sender, targetJid],
            });
    },
};
