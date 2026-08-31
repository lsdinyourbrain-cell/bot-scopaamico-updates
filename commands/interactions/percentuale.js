'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'percentuale',
    aliases: [],
    description: 'Restituisce una percentuale casuale per una domanda.',

    async run(sock, msg, args, context) {
        const { textArgs, reply, services } = context;
        const { randomInt } = services;
        if (!textArgs) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Scrivi qualcosa da misurare._ ▸ _Esempio: \\`.percentuale pizza\\`')}
${boxEnd()}`);
        await reply(`📊 *_PERCENTUALE_*\n\n▸ _${textArgs}_\n▸ _*${randomInt(1, 100)}%*_. Ci sta.\n\n`);
    },
};
