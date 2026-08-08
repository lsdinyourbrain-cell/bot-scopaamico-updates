'use strict';

module.exports = {
    name: 'obbligo',
    aliases: [],
    description: 'Propone una sfida per il gioco verità o obbligo.',

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { ARRAYS, randomChoice } = services;
        await reply(`╔════════════════════════════════╗\n║        🎯 *OBBLIGO* 🎯\n╠════════════════════════════════╣\n║  ${randomChoice(ARRAYS.obbligo)}\n╚════════════════════════════════╝`);
    },
};
