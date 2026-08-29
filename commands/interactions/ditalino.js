'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { runPower } = require('../../lib/power');

module.exports = {
    name: 'ditalino',
    aliases: [],
    description: "Scegli la potenza e fai un ditalino a qualcuno (ironico).",

    async run(sock, msg, args, context) {
        return runPower(sock, msg, args, context, { command: 'ditalino', emoji: '👉👌', title: 'DITALINO' });
    },
};