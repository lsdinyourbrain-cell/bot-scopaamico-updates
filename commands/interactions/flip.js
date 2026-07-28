'use strict';

module.exports = {
    name: 'flip',
    aliases: ['moneta', 'coin'],
    description: "Lancia una moneta: testa o croce.",

    async run(sock, msg, args, context) {
        const { services } = context;
        const { randomChoice } = services;
        const result = randomChoice(['🌕 *TESTA*', '🌑 *CROCE*']);
        await context.reply(`🪙 *Lancia moneta:* ${result}`);
    },
};
