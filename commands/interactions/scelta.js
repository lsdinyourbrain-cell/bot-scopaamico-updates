'use strict';

module.exports = {
    name: 'scelta',
    aliases: [],
    description: 'Sceglie casualmente fra le opzioni passate al comando.',

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { randomChoice } = services;
        const options = args.join(' ').split(/\s*(?:\||,| oppure | o )\s*/i).filter(Boolean);
        if (options.length < 2) return reply('⚠️ _[uso]: Dammi almeno due opzioni._\n▸ _Esempio: \`.scelta pizza o pasta\`_');
        await reply(`🎯 *_LA MIA SCELTA_*\n━━━━━━━━━━━━━━\n▸ Io direi: _*${randomChoice(options)}*_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
    },
};
