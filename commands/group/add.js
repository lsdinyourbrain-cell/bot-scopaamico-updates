'use strict';

module.exports = {
    name: 'add',
    aliases: ['aggiungi', 'invite'],
    description: "Aggiunge un utente al gruppo tramite numero o tag.",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, isBotAdmin, reply, services } = context;
        const { axios } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        let tgt = args.join(' ').replace(/[^0-9]/g, '');
        if (!tgt) return reply("Inserisci il numero o tagga. Es: .add 391234567890");

        tgt = tgt + '@s.whatsapp.net';
        try {
            await sock.groupParticipantsUpdate(from, [tgt], 'add');
            await reply(`✅ @${tgt.split('@')[0]} aggiunto/a al gruppo.`);
        } catch (e) {
            await reply("❌ Impossibile aggiungere. Il numero potrebbe non essere su WhatsApp o ha privacy restrittiva.");
        }
    },
};
