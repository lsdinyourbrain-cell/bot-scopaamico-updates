'use strict';

const { toDecorated } = require('../../lib/font');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'promote',
    aliases: ["demote", "promuovi", "degrada"],
    description: "Promuove o retrocede un admin del gruppo: .promote @utente / .demote @utente.",

    async run(sock, msg, args, context) {
        const { command, from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, reply, services } = context;
        const { logGroupEvent, saveDB, getCachedGroupMeta, sameJid, sendButtons } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ comando riservato agli admin del gruppo.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin del gruppo prima.");
        if (!targetJid || targetJid.endsWith('@g.us')) return reply("⚠️ _[uso]:_ tagga un utente. Esempio: `.promote @utente`");
        if (sameJid(targetJid, sender)) return reply("⚠️ _[uso]:_ non puoi promuoverti/retrocederti da solo.");

        try {
            const isPromote = command === 'promote' || command === 'promuovi';
            const action = isPromote ? 'promote' : 'demote';

            // In LID mode il target è un @lid: risolviamo il PN reale dalle
            // groupMetadata per mostrare il numero giusto nei testi.
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const targetPn = resolveJid(targetJid, meta);
            const useJid = targetPn || targetJid;

            await sock.groupParticipantsUpdate(from, [useJid], action);

            logGroupEvent(from, action, sender, null, targetJid,
                isPromote ? 'promosso amministratore' : 'retrocesso da amministratore');
            saveDB();

            const short = dispOf(targetJid, targetPn);
            const text = isPromote
                ? `👑 ${toDecorated('PROMOTE', 'gothic', '❖')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato *promosso* admin!\n▸ Ora può gestire il gruppo.\n━━━━━━━━━━━━━━━━━━\n◈ _Vex Bot_`
                : `⬇️ ${toDecorated('DEMOTE', 'gothic', '❖')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} non è più admin.\n▸ I suoi privilegi sono stati tolti.\n━━━━━━━━━━━━━━━━━━\n◈ _Vex Bot_`;

            await sendButtons(sock, from, text, [
                { label: '📜 Registro modifiche', id: 'registro' },
            ], msg).catch(() => sock.sendMessage(from, { text, mentions: [useJid] }, { quoted: msg }));
        } catch (e) {
            console.error('[promote/demote]', e.message);
            await reply("⚠️ _[uso]:_ impossibile cambiare i privilegi. Controlla i permessi del bot.");
        }
    },
};