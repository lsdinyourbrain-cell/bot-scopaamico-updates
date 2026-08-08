'use strict';

module.exports = {
    name: 'preleva',
    aliases: ['prel'],
    description: "Preleva soldi dalla banca.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            const amount = parseInt(textArgs);
            if (!amount || amount <= 0) return reply("⚠️ Importo non valido.\n👉 *Uso:* `.preleva 500`");

            const userData = getUser(sender, from);
            if (!userData.bank) userData.bank = 0;
            if (userData.bank < amount) return reply(`❌ In banca hai solo *${userData.bank}€*.`);

            userData.bank -= amount;
            userData.money += amount;
            saveDB();

            await reply(
`╔══════════════════════════════╗
║      🏦 *PRELEVO* 🏦
╠══════════════════════════════╣
║  📤 Prelievo: *${amount}€*
║
║  💰 Contante: *${userData.money}€*
║  🏦 Banca: *${userData.bank}€*
╚══════════════════════════════╝`);
    },
};
