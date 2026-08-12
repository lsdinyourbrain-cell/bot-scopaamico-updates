'use strict';

module.exports = {
    name: 'top',
    aliases: [],
    description: "Esegue il comando .top.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("❌ Comando disponibile solo nei gruppi.");
            const chatUsers = db[from] || {};
            const sorted = Object.entries(chatUsers)
                .filter(([jid, data]) => jid.includes('@') && data && typeof data === 'object')
                .sort((a, b) => (b[1].msgCount || 0) - (a[1].msgCount || 0))
                .slice(0, 5);

            if (sorted.length === 0) return reply("📭 Nessun dato disponibile.");

            let txt = `🏆 *TOP 5 ATTIVI*\n━━━━━━━━━━━━━━━━━━\n`;
            sorted.forEach(([jid, data], i) => {
                const medals = ['🥇', '🥈', '🥉', '４', '５'];
                txt += `${medals[i]} @${jid.split('@')[0]} ➔ *${data.msgCount || 0}* msg\n`;
            });
            txt += `━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(from, { text: txt, mentions: sorted.map(([jid]) => jid) });
    },
};
