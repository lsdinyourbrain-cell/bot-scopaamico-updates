'use strict';

module.exports = {
    name: 'leave',
    aliases: ['esci', 'vattene'],
    description: "Il bot esce dal gruppo (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, reply } = context;

        if (!isGroup) return reply("Non sono in un gruppo qui.");
        if (!isSenderAdmin) return reply("Solo gli admin possono cacciarmi.");

        await reply("😔 Me ne vado... ciao!");
        await sock.groupLeave(from);
    },
};
