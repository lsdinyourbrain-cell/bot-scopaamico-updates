'use strict';

module.exports = {
    name: 'verita',
    aliases: [],
    description: 'Propone una domanda per il gioco verità o obbligo.',

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { ARRAYS, randomChoice } = services;
        await reply(`🗣️ *_VERITÀ_*\n━━━━━━━━━━━━━━\n▸ ${randomChoice(ARRAYS.verita)}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
    },
};
