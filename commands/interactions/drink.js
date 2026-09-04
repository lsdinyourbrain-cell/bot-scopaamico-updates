'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'drink',
    aliases: [],
    description: "Esegue il comando .drink.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { ARRAYS, randomChoice } = services;

        const target = targetJid || sender;
        const drink = randomChoice(ARRAYS.drink);
        const text =
`${sec('DRINK')}
${boxOpen()}
${line(`🍹 @${dispOf(sender)} offre a @${dispOf(target)}:`)}
${line(`🥂 _*${drink}*_`)}
${line(`_Cin cin! 🎉_`)}
${boxEnd()}`;
        await sock.sendMessage(from, {
            text,
            mentions: [sender, target],
        });
    },
};
