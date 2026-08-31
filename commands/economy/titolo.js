'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'titolo',
    aliases: ['badge', 'title'],
    description: "Imposta un titolo personalizzato mostrato sul tuo profilo. Uso: .titolo <testo> (max 25 caratteri) oppure .titolo per vederlo. Per rimuoverlo: .titolo -",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, reply, services } = context;
        const { getUser, saveDB } = services;

        const me = getUser(sender, from);
        const text = String(textArgs || '').trim();

        if (!text) {
            const current = me.title ? `*${me.title.slice(0, 25)}*` : '_nessun titolo_';
            return reply(`🏷️ *_IL TUO TITOLO_*\n\n▸ 🏷️ Titolo: ${current}\n▸ 📝 Impostane uno con _.titolo_\n▸ 🔠 _max 25 caratteri_\n\n`);
        }

        if (text === '-') {
            delete me.title;
            saveDB();
            return reply("🗑️ Titolo rimosso.\n\n");
        }

        if (text.length > 25) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Massimo 25 caratteri per il titolo. ')}
${boxEnd()}`);
        }

        me.title = text;
        saveDB();
        return reply(`🏷️ *_TITOLO IMPOSTATO_*\n\n▸ Da ora il tuo profilo mostra:\n▸ 👉 *${text}*\n\n`);
    },
};