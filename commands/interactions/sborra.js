'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { runPower } = require('../../lib/power');

module.exports = {
    name: 'sborra',
    aliases: [],
    description: "Scegli la potenza e sborra su qualcuno (ironico).",

    async run(sock, msg, args, context) {
        return runPower(sock, msg, args, context, { command: 'sborra', emoji: '💦', title: 'SBORRA' });
    },
};