'use strict';

const { toDecorated } = require('../../lib/font');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'kick',
    aliases: ['caccia', 'butta', 'elimina'],
    description: "Rimuove un utente dal gruppo: .kick @utente (o rispondi a un messaggio).",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, isReply, contextInfo, reply, services } = context;
        const { db, logGroupEvent, sameJid, isOwnerJid, getCachedGroupMeta, sendButtons } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");

        let tgt = targetJid;
        if (!tgt && isReply) tgt = contextInfo?.participant || null;
        if (!tgt) return reply("⚠️ _[uso]:_ tagga o rispondi a chi rimuovere.");

        if (sameJid(tgt, sender)) return reply("⚠️ _[uso]:_ non puoi rimuoverti da solo.");
        if (isOwnerJid(tgt, sock, db, null)) return reply("⛔ Non posso rimuovere l'owner del bot.");

        try {
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const tgtPn = resolveJid(tgt, meta);
            const useJid = tgtPn || tgt;
            const short = dispOf(tgt, tgtPn);

            await sock.groupParticipantsUpdate(from, [useJid], 'remove');
            logGroupEvent(from, 'kick', sender, null, tgt, 'cacciato dal gruppo');

            await sendButtons(sock, from,
                `👋 ${toDecorated('KICK', 'mono', '⏣')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} *cacciato/a* dal gruppo.\n━━━━━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                [{ label: '📜 Registro modifiche', id: 'registro' }], msg)
                .catch(() => sock.sendMessage(from, {
                    text: `👋 ${toDecorated('KICK', 'mono', '⏣')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} *cacciato/a* dal gruppo.\n━━━━━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                    mentions: [useJid],
                }, { quoted: msg }));
        } catch (_) {
            await reply("⚠️ _[uso]:_ non riesco a rimuovere. Controlla permessi.");
        }
    },
};