'use strict';

const { S, SEP, header, footer, bullet, sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'gay',
    aliases: [],
    description: 'Mostra una percentuale goliardica per la persona indicata.',

    async run(sock, msg, args, context) {
        const { from, sender, targetJid, services } = context;
        const { randomInt } = services;
        const person = targetJid || sender;
        const percent = randomInt(1, 100);
        await sock.sendMessage(from, {
            text: `${S.star} ${S.dia}  *GAY O METRO*  ${S.dia} ${S.star}\n${SEP.line}\n${bullet(`@${person.split('@')[0]} è gay al _*${percent}%*_! 🏳️‍🌈`)}\n${SEP.stars}\n${footer()}`,
            mentions: [person],
        });
    },
};
