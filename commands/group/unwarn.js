'use strict';

module.exports = {
    name: 'unwarn',
    aliases: ['togliwarn', 'rimuoviavviso', 'perdona'],
    description: "Rimuove un avviso a un utente taggato.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, getUser, saveDB } = services;

        if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono togliere avvisi.");
        if (!targetJid) return reply("Tagga la persona a cui rimuovere l'avviso.");

        const targetData = getUser(targetJid, from);
        if ((targetData.warnings || 0) <= 0) {
            return await sock.sendMessage(from, {
                text: `✅ @${targetJid.split('@')[0]} non ha avvisi da rimuovere.`,
                mentions: [targetJid],
            });
        }

        targetData.warnLog = Array.isArray(targetData.warnLog) ? targetData.warnLog : [];
        targetData.warnLog.pop(); // rimuovi l'ultimo motivo
        targetData.warnings = targetData.warnLog.length;
        saveDB();

        await sock.sendMessage(from, {
            text: `✅ @${targetJid.split('@')[0]} ha ricevuto un perdono! Avvisi: *${targetData.warnings}/3*`,
            mentions: [targetJid],
        });
    },
};
