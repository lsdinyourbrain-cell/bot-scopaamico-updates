'use strict';

module.exports = {
    name: 'chiudi',
    aliases: ["apri"],
    description: "Esegue il comando .chiudi.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("⚠️ _[uso]:_ questo comando è per gli admin del gruppo.");
            if (!isBotAdmin) return reply("⚠️ _[uso]:_ prima rendimi amministratore, così posso farlo.");
            try {
                const closed = command === 'chiudi';
                await sock.groupSettingUpdate(from, closed ? 'announcement' : 'not_announcement');
                await reply(closed
                    ? `🔒 *_CHIUDI_*\n━━━━━━━━━━━━━━\n▸ Gruppo *chiuso*: ora possono scrivere solo gli *admin*.\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`
                    : `🔓 *_APRI_*\n━━━━━━━━━━━━━━\n▸ Gruppo *riaperto*: tutti possono scrivere di nuovo.\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
            } catch (_) {
                await reply("⚠️ _[uso]:_ non riesco a cambiare l’impostazione del gruppo.");
            }
    },
};
