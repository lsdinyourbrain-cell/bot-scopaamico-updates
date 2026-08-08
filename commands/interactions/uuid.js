'use strict';

module.exports = {
    name: 'uuid',
    aliases: ['guid', 'uuidv4'],
    description: "Genera uno o più UUID (identificativi univoci) casuali.",

    async run(sock, msg, args, context) {
        const { command, textArgs, reply } = context;
        const crypto = require('crypto');

        const n = Math.max(1, Math.min(10, parseInt(textArgs, 10) || 1));
        const lines = [];
        for (let i = 0; i < n; i++) lines.push('`' + crypto.randomUUID() + '`');

        await reply(`╔════════════════════════════════╗\n║        🔑 *UUID* 🔑\n╠════════════════════════════════╣\n║  Generati *${n}*:\n║  ${lines.join('\n║  ')}\n╚════════════════════════════════╝`);
    },
};