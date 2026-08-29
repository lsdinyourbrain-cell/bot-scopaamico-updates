'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { runPower } = require('../../lib/power');

module.exports = {
    name: 'sega',
    aliases: [],
    description: "Scegli la potenza e fai una sega a qualcuno (ironico).",

    async run(sock, msg, args, context) {
        return runPower(sock, msg, args, context, { command: 'sega', emoji: '🍆', title: 'SEGA' });
    },
};