'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'scelta',
    aliases: [],
    description: 'Sceglie casualmente fra le opzioni passate al comando.',

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { randomChoice } = services;
        const options = args.join(' ').split(/\s*(?:\||,| oppure | o )\s*/i).filter(Boolean);
        if (options.length < 2) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Dammi almeno due opzioni._ ▸ _Esempio: \\`.scelta pizza o pasta\\`')}
${boxEnd()}`);
        await reply(`🎯 *_LA MIA SCELTA_*\n\n▸ Io direi: _*${randomChoice(options)}*_\n\n`);
    },
};
