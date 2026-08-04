'use strict';

module.exports = {
    name: 'pausa',
    aliases: ['riprendi'],
    description: "Mette in pausa/riattiva il bot solo in questo gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

        if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
        if (!isSenderAdmin && !isOwner) return reply("Solo gli admin del gruppo possono mettere in pausa il bot.");

        if (!db[from]) db[from] = {};

        if (command === 'pausa') {
            db[from]._muted = true;
            saveDB();
            await sendButtons(sock, from,
`╭━━━━━━━━━━━━━━━━━━╮
┃   ⏸️ *BOT IN PAUSA*   ┃
┃                     ┃
┃ Il bot non risponde ┃
┃ più in questo       ┃
┃ gruppo. Premi il    ┃
┃ pulsante per         ┃
┃ riattivarlo.        ┃
╰━━━━━━━━━━━━━━━━━━╯`,
                [{ label: '▶️ .riprendi', id: 'riprendi' }],
                msg);
        } else {
            db[from]._muted = false;
            saveDB();
            await reply(
`╭━━━━━━━━━━━━━━━━━━╮
┃  ▶️ *BOT RIPRESO*   ┃
┃                     ┃
┃ Il bot è di nuovo   ┃
┃ attivo in questo    ┃
┃ gruppo! 🚀          ┃
╰━━━━━━━━━━━━━━━━━━╯`);
        }
    },
};
