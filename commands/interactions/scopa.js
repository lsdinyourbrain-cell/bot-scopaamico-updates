'use strict';

const { runPower } = require('../../lib/power');

module.exports = {
    name: 'scopa',
    aliases: [],
    description: "Scegli la potenza e scopai qualcuno (ironico).",

    async run(sock, msg, args, context) {
        return runPower(sock, msg, args, context, { command: 'scopa', emoji: '💦', title: 'SCOPA' });
    },
};