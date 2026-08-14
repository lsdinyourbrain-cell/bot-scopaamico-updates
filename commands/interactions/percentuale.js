'use strict';

module.exports = {
    name: 'percentuale',
    aliases: [],
    description: 'Restituisce una percentuale casuale per una domanda.',

    async run(sock, msg, args, context) {
        const { textArgs, reply, services } = context;
        const { randomInt } = services;
        if (!textArgs) return reply('⚠️ _[uso]: Scrivi qualcosa da misurare._\n▸ _Esempio: \`.percentuale pizza\`_');
        await reply(`📊 *_PERCENTUALE_*\n━━━━━━━━━━━━━━\n▸ _${textArgs}_\n▸ _*${randomInt(1, 100)}%*_. Ci sta.\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
    },
};
