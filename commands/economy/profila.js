'use strict';

module.exports = {
    name: 'profilo',
    aliases: ['profila', 'profile'],
    description: "Mostra il profilo utente con statistiche.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const target = targetJid || sender;
            const uDB = getUser(target, from);
            // pushName è il nome di chi invia il comando: lo usiamo solo per il proprio profilo
            const isSelf = sameJid(target, sender);
            const name = isSelf ? (pushName || target.split('@')[0]) : target.split('@')[0];
            const wallet = uDB.money || 0;
            const bank = uDB.bank || 0;
            const msgCount = uDB.msgCount || 0;
            const spouse = uDB.spouse || null;
            const children = uDB.children?.length || 0;
            const parents = uDB.parents?.length || 0;

            let pfpUrl;
            try { pfpUrl = await sock.profilePictureUrl(target, 'image'); } catch (_) { pfpUrl = null; }

            const profileText =
`╔══════════════════════════════╗
║       👤 *PROFILO* 👤
╠══════════════════════════════╣
║  🧑 *${name.slice(0, 20)}*
║
║  💰 Contante: *${wallet}€*
║  🏦 Banca: *${bank}€*
║  💵 Totale: *${wallet + bank}€*
║
║  💍 Sposato: ${spouse ? `@${spouse.split('@')[0]}` : '_No_'}
║  👴 Genitori: *${parents}*
║  🍼 Figli: *${children}*
║
║  💬 Messaggi: *${msgCount}*
╚══════════════════════════════╝`;

            if (pfpUrl) {
                await sock.sendMessage(from, { image: { url: pfpUrl }, caption: profileText, mentions: spouse ? [spouse] : [] });
            } else {
                await sock.sendMessage(from, { text: profileText, mentions: spouse ? [spouse] : [] });
            }
    },
};
