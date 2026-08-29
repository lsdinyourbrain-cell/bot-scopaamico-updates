'use strict';

const { S, SEP, footer, bullet, sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'obbligo',
    aliases: [],
    description: 'Propone una sfida per il gioco verità o obbligo.',

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { ARRAYS, randomChoice } = services;
        await reply(`${S.star} ${S.dia}  *OBBLIGO*  ${S.dia} ${S.star}\n${SEP.line}\n${bullet(`🎯 _${randomChoice(ARRAYS.obbligo)}_`)}\n${SEP.stars}\n${footer()}`);
    },
};
