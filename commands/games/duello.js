'use strict';

module.exports = {
    name: 'duello',
    aliases: ['sfida'],
    description: "Sfida un utente a un duello con una puntata.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, getCachedGroupMeta } = services;


            if (!isGroup) return reply("I duelli sono solo nei gruppi.");
            if (!targetJid || sameJid(targetJid, sender)) return reply("⚠️ _[uso]: tagga il tuo avversario — .duello @utente 100_");

            const cooldownKey = 'duello';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 10000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi sfidare tra *${remain}s*.`);
            }

            const puntata = parseInt(args.find(a => /^\d+$/.test(a))) || 0;
            if (puntata < 10) return reply("⚠️ _[uso]: puntata minima 10€ — .duello @utente 100_");

            const uDB = getUser(sender, from);
            if (uDB.money < puntata) return reply(`Hai solo ${uDB.money}€, non basta.`);

            const tDB = getUser(targetJid, from);
            if (tDB.money < puntata) return reply("Il tuo avversario non ha abbastanza soldi.");

            // Risolve i @lid in numeri di telefono reali (per menzioni e testo)
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const resolve = (jid) => {
                const pn = (meta?.participants || []).find(p =>
                    sameJid(p.id || p.jid, jid) || sameJid(p.phoneNumber, jid)
                )?.phoneNumber;
                return pn || jid;
            };
            const senderPn = resolve(sender);
            const tgtPn = resolve(targetJid);
            const sShort = senderPn.split('@')[0];
            const tShort = tgtPn.split('@')[0];

            const tiro1 = randomInt(1, 6);
            const tiro2 = randomInt(1, 6);

            await sleep(1000);
            await sock.sendMessage(from, {
                text: `⚔️ *_DUELLO_*\n━━━━━━━━━━━━━━\n@${sShort} sfida\n@${tShort} a duello!\n\n▸ *Puntata:* _${puntata}€_\n◈ _Vex Bot_`,
                mentions: [senderPn, tgtPn],
            });
            await sleep(2000);

            let msgText;
            if (tiro1 > tiro2) {
                uDB.money += puntata;
                tDB.money -= puntata;
                msgText = `🏆 @${sShort} ha vinto!\n🎲 ${tiro1} vs ${tiro2}\n+${puntata}€ 💰`;
            } else if (tiro2 > tiro1) {
                uDB.money -= puntata;
                tDB.money += puntata;
                msgText = `🏆 @${tShort} ha vinto!\n🎲 ${tiro2} vs ${tiro1}\n+${puntata}€ 💰`;
            } else {
                msgText = `🤝 Pareggio!\n🎲 Entrambi su ${tiro1}.\nNessuno perde soldi.`;
            }
            userData.cooldowns[cooldownKey] = now;
            saveDB();

            await sock.sendMessage(from, {
                text: `⚔️ *_RISULTATO DUELIO_*\n━━━━━━━━━━━━━━\n🎲 @${sShort} tira _${tiro1}_\n🎲 @${tShort} tira _${tiro2}_\n\n${msgText}\n◈ _Vex Bot_`,
                mentions: [senderPn, tgtPn],
            });
    },
};