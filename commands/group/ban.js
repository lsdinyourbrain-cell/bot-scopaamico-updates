'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDecorated } = require('../../lib/font');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'ban',
    aliases: ['banna', 'espelli'],
    description: "Rimuove un utente dal gruppo: .ban @utente.",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, reply, services } = context;
        const { db, logGroupEvent, sameJid, isOwnerJid, getCachedGroupMeta, sendButtons } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('questo comando funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('questo comando è per gli admin del gruppo.')}
${boxEnd()}`);
        if (!isBotAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('prima rendimi amministratore, così posso farlo.')}
${boxEnd()}`);
        if (!targetJid) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('tagga la persona da rimuovere.')}
${boxEnd()}`);
        if (sameJid(targetJid, sender)) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('non puoi rimuovere te stesso/a con il bot.')}
${boxEnd()}`);
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
                `👋 ${sec('BAN')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato/a *rimosso/a* dal gruppo.\n━━━━━━━━━━━━━━━━━━\n`,
                [{ label: '📜 Registro modifiche', id: 'registro' }], msg, [useJid])
                .catch(() => sock.sendMessage(from, {
                    text: `👋 ${sec('BAN')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato/a *rimosso/a* dal gruppo.\n━━━━━━━━━━━━━━━━━━\n`,
                    mentions: [useJid],
                }, { quoted: msg }));
        } catch (_) {
            await reply("⚠️ _[uso]:_ non riesco a rimuovere questa persona. Controlla i permessi del bot.");
        }
    },
};