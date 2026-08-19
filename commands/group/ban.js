'use strict';

const { toDecorated } = require('../../lib/font');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'ban',
    aliases: ['banna', 'espelli'],
    description: "Rimuove un utente dal gruppo: .ban @utente.",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, reply, services } = context;
        const { db, logGroupEvent, sameJid, isOwnerJid, getCachedGroupMeta, sendButtons } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ questo comando è per gli admin del gruppo.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ prima rendimi amministratore, così posso farlo.");
        if (!targetJid) return reply("⚠️ _[uso]:_ tagga la persona da rimuovere.");
        if (sameJid(targetJid, sender)) return reply("⚠️ _[uso]:_ non puoi rimuovere te stesso/a con il bot.");
        if (isOwnerJid(targetJid, sock, db, null)) return reply("⛔ Non posso rimuovere l'owner del bot.");

        try {
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const tgtPn = resolveJid(targetJid, meta);
            const useJid = tgtPn || targetJid;
            const short = dispOf(useJid);

            await sock.groupParticipantsUpdate(from, [useJid], 'remove');
            logGroupEvent(from, 'ban', sender, null, targetJid, 'rimosso dal gruppo');

            await sendButtons(sock, from,
                `👋 ${toDecorated('BAN', 'mono', '⏣')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato/a *rimosso/a* dal gruppo.\n━━━━━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                [{ label: '📜 Registro modifiche', id: 'registro' }], msg, [useJid])
                .catch(() => sock.sendMessage(from, {
                    text: `👋 ${toDecorated('BAN', 'mono', '⏣')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato/a *rimosso/a* dal gruppo.\n━━━━━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                    mentions: [useJid],
                }, { quoted: msg }));
        } catch (_) {
            await reply("⚠️ _[uso]:_ non riesco a rimuovere questa persona. Controlla i permessi del bot.");
        }
    },
};