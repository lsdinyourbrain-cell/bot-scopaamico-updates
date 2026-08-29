'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'unwarn',
    aliases: ['togliwarn', 'rimuoviavviso', 'perdona'],
    description: "Rimuove un avviso a un utente taggato.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, getUser, saveDB } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('questo comando funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin possono togliere avvisi.')}
${boxEnd()}`);
        if (!targetJid) return reply("⚠️ _[uso]:_ tagga la persona a cui rimuovere l'avviso.");

        const targetData = getUser(targetJid, from);
        if ((targetData.warnings || 0) <= 0) {
            return await sock.sendMessage(from, {
                text: `✅ *_UNWARN_*
▸ @${targetJid.split('@')[0]} non ha *avvisi* da rimuovere.
`,
                mentions: [targetJid],
            });
        }

        targetData.warnLog = Array.isArray(targetData.warnLog) ? targetData.warnLog : [];
        targetData.warnLog.pop(); // rimuovi l'ultimo motivo
        targetData.warnings = targetData.warnLog.length;
        saveDB();

        await sock.sendMessage(from, {
            text: `✅ *_UNWARN_*
▸ @${targetJid.split('@')[0]} ha ricevuto un *perdono*!
▸ *Avvisi:* _${targetData.warnings}/3_
`,
            mentions: [targetJid],
        });
    },
};
