'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDecorated } = require('../../lib/font');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'kick',
    aliases: ['caccia', 'butta', 'elimina'],
    description: "Rimuove un utente dal gruppo: .kick @utente (o rispondi a un messaggio).",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, isReply, contextInfo, reply, services } = context;
        const { db, logGroupEvent, sameJid, isOwnerJid, getCachedGroupMeta, sendButtons } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin.')}
${boxEnd()}`);
        if (!isBotAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('rendimi admin prima.')}
${boxEnd()}`);

        let tgt = targetJid;
        if (!tgt && isReply) tgt = contextInfo?.participant || null;
        if (!tgt) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('tagga o rispondi a chi rimuovere.')}
${boxEnd()}`);

        if (sameJid(tgt, sender)) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('non puoi rimuoverti da solo.')}
${boxEnd()}`);
        if (isOwnerJid(tgt, sock, db, null)) return reply("⛔ Non posso rimuovere l'owner del bot.");

        try {
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const tgtPn = resolveJid(tgt, meta);
            const useJid = tgtPn || tgt;
            const short = dispOf(useJid);

            await sock.groupParticipantsUpdate(from, [useJid], 'remove');
            logGroupEvent(from, 'kick', sender, null, tgt, 'cacciato dal gruppo');

            await sendButtons(sock, from,
                `👋 ${sec('KICK')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} *cacciato/a* dal gruppo.\n━━━━━━━━━━━━━━━━━━\n`,
                [{ label: '📜 Registro modifiche', id: 'registro' }], msg, [useJid])
                .catch(() => sock.sendMessage(from, {
                    text: `👋 ${sec('KICK')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} *cacciato/a* dal gruppo.\n━━━━━━━━━━━━━━━━━━\n`,
                    mentions: [useJid],
                }, { quoted: msg }));
        } catch (_) {
            await reply("⚠️ _[uso]:_ non riesco a rimuovere. Controlla permessi.");
        }
    },
};