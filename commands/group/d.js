'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDecorated } = require('../../lib/font');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'd',
    aliases: [],
    description: "Alias rapido per .demote.",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, reply, services } = context;
        const { db, sameJid, isOwnerJid, getCachedGroupMeta, sendButtons } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('comando riservato agli admin.')}
${boxEnd()}`);
        if (!isBotAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('rendimi admin prima.')}
${boxEnd()}`);
        if (!targetJid || sameJid(targetJid, sender)) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('tagga un utente da degradare.')}
${boxEnd()}`);
        if (isOwnerJid(targetJid, sock, db, null)) return reply("⛔ Non posso degradare l'owner del bot.");

        try {
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const tgtPn = resolveJid(targetJid, meta);
            const useJid = tgtPn || targetJid;
            const short = dispOf(useJid);

            await sock.groupParticipantsUpdate(from, [useJid], 'demote');

            await sendButtons(sock, from,
                `⬇️ ${sec('DEMOTE')}\n\n▸ @${short} non è più *admin*.\n\n`,
                [{ label: '📜 Registro modifiche', id: 'registro' }], msg, [useJid])
                .catch(() => sock.sendMessage(from, {
                    text: `⬇️ ${sec('DEMOTE')}\n\n▸ @${short} non è più *admin*.\n\n`,
                    mentions: [useJid],
                }, { quoted: msg }));
        } catch (_) {
            await reply("⚠️ _[uso]:_ non riesco a degradare. Controlla i permessi.");
        }
    },
};