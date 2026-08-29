'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'leave',
    aliases: ['esci', 'vattene'],
    description: "Il bot esce dal gruppo (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, reply } = context;

        if (!isGroup) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('non sono in un gruppo qui.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin possono cacciarmi.')}
${boxEnd()}`);

        await reply(`😔 *_LEAVE_*
▸ Me ne vado... ciao!
`);
        await sock.groupLeave(from);
    },
};
