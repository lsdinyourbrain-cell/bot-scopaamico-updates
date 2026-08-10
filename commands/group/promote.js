'use strict';

module.exports = {
    name: 'promote',
    aliases: ["demote", "promuovi", "degrada"],
    description: "Esegue il comando .promote.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("❌ Funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("⛔ Comando riservato agli admin del gruppo.");
            if (!isBotAdmin) return reply("❌ Rendimi admin del gruppo prima.");
            if (!targetJid || sameJid(targetJid, sender)) return reply("Tagga un utente. Esempio: `.promote @utente`");
            try {
                const isPromote = command === 'promote' || command === 'promuovi';
                const action = isPromote ? 'promote' : 'demote';
                await sock.groupParticipantsUpdate(from, [targetJid], action);
                const short = targetJid.split('@')[0];
                const text = isPromote
                    ? `👑 @${short} è stato promosso *admin*!`
                    : `⬇️ @${short} non è più admin.`;
                await sock.sendMessage(from, { text, mentions: [targetJid] }, { quoted: msg });
            } catch (e) {
                console.error('[promote/demote]', e.message);
                await reply("❌ Impossibile cambiare i privilegi. Controlla i permessi del bot.");
            }
    },
};
