'use strict';

module.exports = {
    name: 'sponsor',
    aliases: [],
    description: "Mostra lo sponsor del bot con un messaggio stupendo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        await sock.sendMessage(from, {
            text:
`╔══════════════════════════════════════╗
║   🌟 *SPONSOR UFFICIALE* 🌟         ║
╠══════════════════════════════════════╣
║                                      ║
║  Ciao! Sono il *ScopaAmico Bot* 🤖   ║
║                                      ║
║  Se ti piace come lavoro e vuoi     ║
║  supportarmi, unisciti al gruppo    ║
║  ufficiale del mio creatore! 🫶     ║
║                                      ║
╠══════════════════════════════════════╣
║                                      ║
║  👇 *CLICCA QUI SOTTO* 👇           ║
║                                      ║
║  https://chat.whatsapp.com/         ║
║  FYvFuxdBSDiFbZBedloPgo             ║
║                                      ║
╠══════════════════════════════════════╣
║  💬 Gruppo ufficiale del creatore   ║
║  🔗 Entra e saluta! 🎉              ║
╚══════════════════════════════════════╝`,
        }, { quoted: msg });
    },
};
