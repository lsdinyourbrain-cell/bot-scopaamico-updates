'use strict';

module.exports = {
    name: 'duello',
    aliases: ['sfida'],
    description: "Sfida un utente a un duello con una puntata.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            if (!isGroup) return reply("I duelli sono solo nei gruppi.");
            if (!targetJid || sameJid(targetJid, sender)) return reply("Tagga il tuo avversario. Es: `.duello @utente 100`");

            const puntata = parseInt(args.find(a => /^\d+$/.test(a))) || 0;
            if (puntata < 10) return reply("La puntata minima è 10€. Es: `.duello @utente 100`");

            const uDB = getUser(sender, from);
            if (uDB.money < puntata) return reply(`Hai solo ${uDB.money}€, non basta.`);

            const tDB = getUser(targetJid, from);
            if (tDB.money < puntata) return reply("Il tuo avversario non ha abbastanza soldi.");

            const tiro1 = randomInt(1, 6);
            const tiro2 = randomInt(1, 6);

            await sleep(1000);
            await sock.sendMessage(from, {
                text: `╔══════════════════════════════════╗\n║      ⚔️ *DUELLO* ⚔️\n╠══════════════════════════════════╣\n║  @${sender.split('@')[0]} sfida\n║  @${targetJid.split('@')[0]} a duello!\n║\n║  💰 Puntata: *${puntata}€*\n╚══════════════════════════════════╝`,
                mentions: [sender, targetJid],
            });
            await sleep(2000);

            let msgText;
            if (tiro1 > tiro2) {
                uDB.money += puntata;
                tDB.money -= puntata;
                msgText = `🏆 @${sender.split('@')[0]} vince il duello! (${tiro1} vs ${tiro2})\n+${puntata}€ 💰`;
            } else if (tiro2 > tiro1) {
                uDB.money -= puntata;
                tDB.money += puntata;
                msgText = `🏆 @${targetJid.split('@')[0]} vince il duello! (${tiro2} vs ${tiro1})\n+${puntata}€ 💰`;
            } else {
                msgText = `🤝 Pareggio! Entrambi hanno fatto ${tiro1}. Nessuno perde soldi.`;
            }
            saveDB();

            await sock.sendMessage(from, {
                text: `╔══════════════════════════════════╗\n╠════ *RISULTATO DUELIO* ════╣\n║  🎲 @${sender.split('@')[0]} tira *${tiro1}*\n║  🎲 @${targetJid.split('@')[0]} tira *${tiro2}*\n║\n║  ${msgText.split('\n').join('\n║  ')}\n╚══════════════════════════════════╝`,
                mentions: [sender, targetJid],
            });
    },
};
