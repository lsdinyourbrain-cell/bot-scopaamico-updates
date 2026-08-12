'use strict';

module.exports = {
    name: 'dona',
    aliases: ['regala'],
    description: "Dona soldi a un altro utente.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
        if (!targetJid) return reply("Tagga la persona a cui vuoi donare. Esempio: `.dona @utente 100`");
        if (sameJid(targetJid, sender)) return reply("Non puoi donare soldi a te stesso!");

        const amount = parseInt(args.find(a => /^\d+$/.test(a)));
        if (!amount || amount <= 0) return reply("Specifica un importo valido. Esempio: `.dona @utente 100`");

        const senderData = getUser(sender, from);
        if (senderData.money < amount) return reply(`Non hai abbastanza soldi. Hai solo *${formatMoney(senderData.money)}*`);

        const targetData = getUser(targetJid, from);
        senderData.money -= amount;
        targetData.money += amount;
        saveDB();

        await sock.sendMessage(from, {
            text: `🎁 *DONAZIONE!*\n━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} ha donato\n*${amount}€* a @${targetJid.split('@')[0]}! 🫶\n\n💰 Il tuo saldo: *${formatMoney(senderData.money)}*\n━━━━━━━━━━━━━━━━━━`,
            mentions: [sender, targetJid],
        });
    },
};
