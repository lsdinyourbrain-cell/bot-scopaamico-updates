'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'flip',
    aliases: ['moneta', 'coin'],
    description: "Lancia una moneta: testa o croce.",

    async run(sock, msg, args, context) {
        const { services } = context;
        const { randomChoice } = services;
        const result = randomChoice(['🌕 *TESTA*', '🌑 *CROCE*']);
        await context.reply(`${sec('LANCIA MONETA')}\n${boxOpen()}\n\n${boxEnd()}`);
    },
};
