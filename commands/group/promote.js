'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDecorated } = require('../../lib/font');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'promote',
    aliases: ["demote", "promuovi", "degrada"],
    description: "Promuove o retrocede un admin del gruppo: .promote @utente / .demote @utente.",

    async run(sock, msg, args, context) {
        const { command, from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, reply, services } = context;
        const { logGroupEvent, saveDB, getCachedGroupMeta, sameJid, sendButtons } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('comando riservato agli admin del gruppo.')}
${boxEnd()}`);
        if (!isBotAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('rendimi admin del gruppo prima.')}
${boxEnd()}`);
        if (!targetJid || targetJid.endsWith('@g.us')) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('tagga un utente. Esempio: \`.promote @utente\`')}
${boxEnd()}`);
        if (sameJid(targetJid, sender)) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('non puoi promuoverti/retrocederti da solo.')}
${boxEnd()}`);

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

            const short = dispOf(useJid);
            const text = isPromote
                ? `👑 ${sec('PROMOTE')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato *promosso* admin!\n▸ Ora può gestire il gruppo.\n━━━━━━━━━━━━━━━━━━\n`
                : `⬇️ ${sec('DEMOTE')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} non è più admin.\n▸ I suoi privilegi sono stati tolti.\n━━━━━━━━━━━━━━━━━━\n`;

            await sendButtons(sock, from, text, [
                { label: '📜 Registro modifiche', id: 'registro' },
            ], msg, [useJid]).catch(() => sock.sendMessage(from, { text, mentions: [useJid] }, { quoted: msg }));
        } catch (e) {
            console.error('[promote/demote]', e.message);
            await reply("⚠️ _[uso]:_ impossibile cambiare i privilegi. Controlla i permessi del bot.");
        }
    },
};