'use strict';

module.exports = {
    name: 'scelta',
    aliases: [],
    description: 'Sceglie casualmente fra le opzioni passate al comando.',

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { randomChoice } = services;
        const options = args.join(' ').split(/\s*(?:\||,| oppure | o )\s*/i).filter(Boolean);
        if (options.length < 2) return reply('Dammi almeno due opzioni. Esempio: `.scelta pizza o pasta`');
        await reply(`╔════════════════════════════════╗\n║      🎯 *LA MIA SCELTA* 🎯\n╠════════════════════════════════╣\n║  Io direi: *${randomChoice(options)}*\n╚════════════════════════════════╝`);
    },
};
