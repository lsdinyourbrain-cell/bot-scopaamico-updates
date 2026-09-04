'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'simpatometro',
    aliases: [],
    description: 'Misura in modo goliardico la simpatia della persona indicata.',

    async run(sock, msg, args, context) {
        const { from, sender, targetJid, services } = context;
        const { randomInt } = services;
        const person = targetJid || sender;
        const percent = randomInt(1, 100);
        const note = percent >= 80 ? '⭐ spacca davvero' : percent >= 50 ? '👍 promosso/a' : '💬 può fare di meglio';
        await sock.sendMessage(from, {
            text: `   *SIMPATOMETRO*   \n\n${line(`@${dispOf(person)}`)}\n${line(`*Simpatia:* _*${percent}%*_`)}\n${line(`${note}`)}\n\n`,
            mentions: [person],
        });
    },
};
