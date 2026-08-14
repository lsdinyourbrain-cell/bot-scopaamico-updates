'use strict';

module.exports = {
    name: 'flip',
    aliases: ['moneta', 'coin'],
    description: "Lancia una moneta: testa o croce.",

    async run(sock, msg, args, context) {
        const { services } = context;
        const { randomChoice } = services;
        const result = randomChoice(['🌕 *TESTA*', '🌑 *CROCE*']);
        await context.reply(`🪙 *_LANCIA MONETA_*\n━━━━━━━━━━━━━━\n▸ ${result}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
    },
};
