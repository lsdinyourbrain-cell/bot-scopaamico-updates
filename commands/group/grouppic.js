'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'grouppic',
    aliases: ['gpfoto', 'pfpgruppo', 'groupprofile'],
    description: "Mostra la foto del gruppo.",

    async run(sock, msg, args, context) {
        const { from, isGroup, reply } = context;

        if (!isGroup) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('non sei in un gruppo.')}
${boxEnd()}`);
        try {
            const url = await sock.profilePictureUrl(from, 'image');
            await sock.sendMessage(from, {
                image: { url },
                caption: `🖼️ *_FOTO DEL GRUPPO_*\n\n`,
            }, { quoted: msg });
        } catch (_) {
            await reply("⚠️ _[uso]:_ nessuna foto profilo trovata.");
        }
    },
};
