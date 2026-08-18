'use strict';

module.exports = {
    name: 'leave',
    aliases: ['esci', 'vattene'],
    description: "Il bot esce dal gruppo (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, reply } = context;

        if (!isGroup) return reply("⚠️ _[uso]:_ non sono in un gruppo qui.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin possono cacciarmi.");

        await reply(`😔 *_LEAVE_*
━━━━━━━━━━━━━━
▸ Me ne vado... ciao!
━━━━━━━━━━━━━━
◈ _Vex Bot_`);
        await sock.groupLeave(from);
    },
};
