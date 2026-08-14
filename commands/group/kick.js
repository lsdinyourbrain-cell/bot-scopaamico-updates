'use strict';

module.exports = {
    name: 'kick',
    aliases: ['caccia', 'butta', 'elimina'],
    description: "Rimuove un utente dal gruppo (admin).",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, isReply, contextInfo, reply } = context;
        const { sameJid } = context.services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");

        let tgt = targetJid;
        if (!tgt && isReply) tgt = contextInfo?.participant || null;
        if (!tgt) return reply("⚠️ _[uso]:_ tagga o rispondi a chi rimuovere.");

        if (sameJid(tgt, sender)) return reply("⚠️ _[uso]:_ non puoi rimuoverti da solo.");

        try {
            await sock.groupParticipantsUpdate(from, [tgt], 'remove');
            await sock.sendMessage(from, {
                text: `👋 *_KICK_*
━━━━━━━━━━━━━━
▸ @${tgt.split('@')[0]} *cacciato/a* dal gruppo.
━━━━━━━━━━━━━━
◈ _Vex Bot_`,
                mentions: [tgt],
            });
        } catch (_) {
            await reply("⚠️ _[uso]:_ non riesco a rimuovere. Controlla permessi.");
        }
    },
};
