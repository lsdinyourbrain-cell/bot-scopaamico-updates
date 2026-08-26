'use strict';

const { S, SEP, footer, bullet } = require('../../lib/ui');

module.exports = {
    name: 'verita',
    aliases: [],
    description: 'Propone una domanda per il gioco verità o obbligo.',

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { ARRAYS, randomChoice } = services;
        await reply(`${S.star} ${S.dia}  *VERITÀ*  ${S.dia} ${S.star}\n${SEP.line}\n${bullet(`🗣️ _${randomChoice(ARRAYS.verita)}_`)}\n${SEP.stars}\n${footer()}`);
    },
};
