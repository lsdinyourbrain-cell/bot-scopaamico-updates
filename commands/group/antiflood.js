'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'antiflood',
    aliases: ['flood'],
    description: "Attiva/disattiva l'anti-flood di questo gruppo: .antiflood on | off (senza argomenti mostra lo stato).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isSenderAdmin, isOwner, reply, services } = context;
        const { db, saveDB } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin && !isOwner) return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('comando riservato agli admin del gruppo.')}
${boxEnd()}`);

        const q = String(textArgs || '').trim().toLowerCase();
        const active = db[from]?._antiflood !== false; // default: attivo

        if (!q) {
            return reply(
`🔁 *ANTI-FLOOD*
▸ Stato: ${active ? '✅ *ATTIVO*' : '🚫 *SPENTO*'}
▸ Chi scrive troppi messaggi in
  fretta viene mutato 1 minuto.
▸ L'owner del bot è sempre esente.
💡 \`.antiflood on\` / \`.antiflood off\`
`);
        }

        if (q === 'on' || q === 'attiva' || q === 'si') {
            if (active) return reply("✅ L'anti-flood è già *attivo* in questo gruppo.");
            db[from] = db[from] || {};
            delete db[from]._antiflood;
            saveDB();
            return reply(
`🔁 *ANTI-FLOOD ATTIVATO*
▸ Chi scrive troppi messaggi in
  fretta verrà mutato 1 minuto.
▸ L'owner del bot è sempre esente.
`);
        }

        if (q === 'off' || q === 'disattiva' || q === 'no') {
            if (!active) return reply("🚫 L'anti-flood è già *spento* in questo gruppo.");
            db[from] = db[from] || {};
            db[from]._antiflood = false;
            saveDB();
            return reply(
`🔁 *ANTI-FLOOD DISATTIVATO*
▸ Nessun limite di messaggi.
▸ Puoi riattivarlo con
  \`.antiflood on\` quando vuoi.
`);
        }

        return reply(`${sec('ERRORE')}
${boxOpen()}
${line('\\`.antiflood on\\` oppure \\`.antiflood off\\`')}
${boxEnd()}`);
    },
};