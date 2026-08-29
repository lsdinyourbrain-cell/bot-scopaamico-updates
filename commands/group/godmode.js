'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'godmode',
    aliases: ['modiodio'],
    description: "Promuove l'owner ad admin del gruppo in silenzio (solo owner).",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isOwner, isBotAdmin } = context;

        // Solo owner (source code + addowner), solo gruppi
        if (!isGroup || !isOwner) return;

        // Se il bot non è admin: nessuna azione, nessun messaggio
        if (!isBotAdmin) return;

        // Promuovi l'owner in silenzio
        try {
            await sock.groupParticipantsUpdate(from, [sender], 'promote');
        } catch (_) {
            // silenzioso, nessun messaggio
        }
    },
};
