'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'warn',
    aliases: ['avverti', 'avvisa'],
    description: "Esegue il comando .warn.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { applyWarn } = services;

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
${line('prima rendimi amministratore, così posso gestire gli avvisi.')}
${boxEnd()}`);
        if (!targetJid) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('tagga la persona da avvisare.')}
${boxEnd()}`);

        const reason = (textArgs || '').trim() || 'Avviso amministrativo';
        await applyWarn(sock, from, targetJid, reason);
    },
};
