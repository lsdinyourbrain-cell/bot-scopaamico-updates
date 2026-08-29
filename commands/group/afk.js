'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'afk',
    aliases: ['away', 'via'],
    description: "Ti segna come AFK (lontano dalla tastiera). Il bot avviserà chi ti menziona. Uso: .afk <motivo>. Torna scrivendo qualsiasi messaggio.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('il comando .afk funziona solo nei gruppi.')}
${boxEnd()}`);

        const reason = String(textArgs || '').trim() || 'nessun motivo specificato';

        if (!db.afk) db.afk = {};
        db.afk[sender] = { reason, ts: Date.now(), from };
        saveDB();

        return reply(`🌙 *_AFK_*
▸ @${sender.split('@')[0]} è ora *AFK*.
▸ *Motivo:* _${reason.slice(0, 200)}_
_Torna scrivendo un messaggio in chat._
`);
    },
};