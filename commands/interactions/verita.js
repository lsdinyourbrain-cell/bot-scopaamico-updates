'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'verita',
    aliases: [],
    description: 'Propone una domanda per il gioco verità o obbligo.',

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { ARRAYS, randomChoice } = services;
        await reply(`   *VERITÀ*   \n\n${line(`🗣️ _${randomChoice(ARRAYS.verita)}_`)}\n\n`);
    },
};
