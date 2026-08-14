'use strict';

module.exports = {
    name: 'ruba',
    aliases: [],
    description: "Tenta di rubare soldi a un utente.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            if (!isGroup) return reply("⚠️ Funziona solo nei gruppi.");
            if (!targetJid) return reply("⚠️ _[uso]: .ruba @utente_");
            if (sameJid(sender, targetJid)) return reply("Non puoi rubare a te stesso, scemo 😂");

            const targetData = getUser(targetJid, from);
            const thiefData = getUser(sender, from);

            if (targetData.money < 10) {
                return await sock.sendMessage(from, {
                    text: `@${targetJid.split('@')[0]} è al verde, non ha niente da rubare! 🍃`,
                    mentions: [targetJid],
                });
            }

            const success = Math.random() < 0.45;
            if (!success) {
                const penalty = Math.floor(Math.random() * 30) + 10;
                thiefData.money = Math.max(0, thiefData.money - penalty);
                saveDB();
                return reply(
`🚔 *_BECCATO!_*
━━━━━━━━━━━━━━
▸ 😱 Il proprietario ti ha fatto una multa di _${penalty}€_!
━━━━━━━━━━━━━━
▸ 💰 Saldo: _${thiefData.money}€_
◈ _Vex Bot_`);
            }

            const stolen = Math.min(targetData.money, Math.floor(Math.random() * 100) + 20);
            targetData.money -= stolen;
            thiefData.money += stolen;
            saveDB();

            await sock.sendMessage(from, {
                text: `🕵️ *_FURTO!_*\n━━━━━━━━━━━━━━\n▸ 💀 @${sender.split('@')[0]} ha rubato _${stolen}€_ a @${targetJid.split('@')[0]}!\n━━━━━━━━━━━━━━\n▸ 💰 Il tuo saldo: _${thiefData.money}€_\n◈ _Vex Bot_`,
                mentions: [sender, targetJid],
            });
    },
};
