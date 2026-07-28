'use strict';

module.exports = {
    name: 'grouppic',
    aliases: ['gpfoto', 'pfpgruppo', 'groupprofile'],
    description: "Mostra la foto del gruppo.",

    async run(sock, msg, args, context) {
        const { from, isGroup, reply } = context;

        if (!isGroup) return reply("Non sei in un gruppo.");
        try {
            const url = await sock.profilePictureUrl(from, 'image');
            await sock.sendMessage(from, {
                image: { url },
                caption: `🖼️ *Foto del gruppo*`,
            }, { quoted: msg });
        } catch (_) {
            await reply("❌ Nessuna foto profilo trovata.");
        }
    },
};
