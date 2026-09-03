'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'obbligo',
    aliases: [],
    description: 'Propone una sfida per il gioco verità o obbligo.',

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { ARRAYS, randomChoice } = services;
        await reply(`   *OBBLIGO*   \n\n${line(`🎯 _${randomChoice(ARRAYS.obbligo)}_`)}\n\n`);
    },
};
