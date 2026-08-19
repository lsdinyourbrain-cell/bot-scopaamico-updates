'use strict';

const { toDecorated } = require('../../lib/font');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'p',
    aliases: [],
    description: "Alias rapido per .promote.",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, reply, services } = context;
        const { db, sameJid, isOwnerJid, getCachedGroupMeta, sendButtons } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ comando riservato agli admin.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");
        if (!targetJid || sameJid(targetJid, sender)) return reply("⚠️ _[uso]:_ tagga un utente da promuovere.");
        if (isOwnerJid(targetJid, sock, db, null)) return reply("⛔ Non posso promuovere l'owner del bot.");

        try {
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const tgtPn = resolveJid(targetJid, meta);
            const useJid = tgtPn || targetJid;
            const short = dispOf(useJid);

            await sock.groupParticipantsUpdate(from, [useJid], 'promote');

            await sendButtons(sock, from,
                `👑 ${toDecorated('PROMOTE', 'gothic', '❖')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato *promosso* admin!\n━━━━━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                [{ label: '📜 Registro modifiche', id: 'registro' }], msg, [useJid])
                .catch(() => sock.sendMessage(from, {
                    text: `👑 ${toDecorated('PROMOTE', 'gothic', '❖')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato *promosso* admin!\n━━━━━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                    mentions: [useJid],
                }, { quoted: msg }));
        } catch (_) {
            await reply("⚠️ _[uso]:_ non riesco a promuovere. Controlla i permessi.");
        }
    },
};