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

        return sock.sendMessage(from, { text: `${sec('AFK')}\n${boxOpen()}\n${line(`@${sender.split('@')[0]} è ora AFK.`)}\n${line(`Motivo: ${reason.slice(0,200)}`)}\n${line('Torna scrivendo un messaggio.')}\n${boxEnd()}`, mentions: [sender] }, { quoted: msg });
    },
};