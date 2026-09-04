'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

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
            text: `   *GAY O METRO*   \n\n${line(`@${dispOf(person)} è gay al _*${percent}%*_! 🏳️‍🌈`)}\n\n`,
            mentions: [person],
        });
    },
};
