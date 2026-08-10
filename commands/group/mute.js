'use strict';

module.exports = {
    name: 'mute',
    aliases: ["unmute", "muta", "smuta", "riabilita"],
    description: "Silenzia un utente (permanente).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono mutare.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        // targetJid: reply = quoted participant, mention = @tag
        let tgt = targetJid;
        if (!tgt && isReply) {
            const quoted = contextInfo?.quotedMessage;
            if (quoted) {
                const fromMaybe = contextInfo?.participant || contextInfo?.remoteJid;
                if (fromMaybe) tgt = fromMaybe;
            }
        }
        if (!tgt) return reply("Rispondi a un messaggio o tagga la persona da mutare.");

        const targetData = getUser(tgt, from);

        if (command === 'unmute' || command === 'smuta' || command === 'riabilita') {
            targetData.isMuted = false;
            saveDB();
            return await sock.sendMessage(from, { text: `🔊 @${tgt.split('@')[0]} può scrivere di nuovo.`, mentions: [tgt] });
        }

        targetData.isMuted = true;
        saveDB();

        await sock.sendMessage(from, {
            text: `🔇 @${tgt.split('@')[0]} è stato mutato permanentemente.`,
            mentions: [tgt],
        });
    },
};
