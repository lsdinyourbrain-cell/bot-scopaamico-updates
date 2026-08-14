'use strict';

module.exports = {
    name: 'warn',
    aliases: ['avverti', 'avvisa'],
    description: "Esegue il comando .warn.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { applyWarn } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ questo comando è per gli admin del gruppo.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ prima rendimi amministratore, così posso gestire gli avvisi.");
        if (!targetJid) return reply("⚠️ _[uso]:_ tagga la persona da avvisare.");

        const reason = (textArgs || '').trim() || 'Avviso amministrativo';
        await applyWarn(sock, from, targetJid, reason);
    },
};
