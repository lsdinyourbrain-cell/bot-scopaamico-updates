'use strict';

module.exports = {
    name: 'kick',
    aliases: ['caccia', 'butta', 'elimina'],
    description: "Rimuove un utente dal gruppo (admin).",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, isReply, contextInfo, reply } = context;
        const { sameJid } = context.services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        let tgt = targetJid;
        if (!tgt && isReply) tgt = contextInfo?.participant || null;
        if (!tgt) return reply("Tagga o rispondi a chi rimuovere.");

        if (sameJid(tgt, sender)) return reply("Non puoi rimuoverti da solo.");

        try {
            await sock.groupParticipantsUpdate(from, [tgt], 'remove');
            await sock.sendMessage(from, {
                text: `👋 @${tgt.split('@')[0]} cacciato/a dal gruppo.`,
                mentions: [tgt],
            });
        } catch (_) {
            await reply("Non riesco a rimuovere. Controlla permessi.");
        }
    },
};
