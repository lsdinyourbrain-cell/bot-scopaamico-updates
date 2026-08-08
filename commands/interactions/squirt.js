'use strict';

const { runPower } = require('../../lib/power');

module.exports = {
    name: 'squirt',
    aliases: [],
    description: "Scegli la potenza e squarta su qualcuno (ironico).",

    async run(sock, msg, args, context) {
        return runPower(sock, msg, args, context, { command: 'squirt', emoji: '💧', title: 'SQUIRT' });
    },
};