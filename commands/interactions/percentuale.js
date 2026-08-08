'use strict';

module.exports = {
    name: 'percentuale',
    aliases: [],
    description: 'Restituisce una percentuale casuale per una domanda.',

    async run(sock, msg, args, context) {
        const { textArgs, reply, services } = context;
        const { randomInt } = services;
        if (!textArgs) return reply('Scrivi qualcosa da misurare. Esempio: `.percentuale pizza`');
        await reply(`╔════════════════════════════════╗\n║      📊 *PERCENTUALE* 📊\n╠════════════════════════════════╣\n║  ${textArgs}\n║\n║  ➡ *${randomInt(1, 100)}%*. Ci sta.\n╚════════════════════════════════╝`);
    },
};
