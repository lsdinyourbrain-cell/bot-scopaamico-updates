'use strict';

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
            text: `╔════════════════════════════════╗\n║      🌈 *GAY O METRO* 🌈\n╠════════════════════════════════╣\n║  @${person.split('@')[0]} è gay\n║  al *${percent}%*! 🏳️‍🌈\n╚════════════════════════════════╝`,
            mentions: [person],
        });
    },
};
