'use strict';

module.exports = {
    name: 'warn',
    aliases: [],
    description: "Esegue il comando .warn.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { applyWarn } = services;

        if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Questo comando è per gli admin del gruppo.");
        if (!isBotAdmin) return reply("Prima rendimi amministratore, così posso gestire gli avvisi.");
        if (!targetJid) return reply("Tagga la persona da avvisare.");

        const reason = (textArgs || '').trim() || 'Avviso amministrativo';
        await applyWarn(sock, from, targetJid, reason);
    },
};
