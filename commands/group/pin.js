'use strict';

module.exports = {
    name: 'pin',
    aliases: ['fissa', 'unpin', 'sfissa'],
    description: "Fissa un messaggio nel gruppo (admin). Se è già fissato, lo sfissa.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isReply, contextInfo, isSenderAdmin, isBotAdmin, reply, services } = context;
        const { sameJid } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");
        if (!isReply || !contextInfo?.stanzaId) return reply("Rispondi al messaggio da fissare.");

        const isUnpin = command === 'unpin' || command === 'sfissa';

        // Costruisce la key del messaggio quotato
        const key = {
            remoteJid: from,
            fromMe: contextInfo?.participant ? false : false,
            id: contextInfo.stanzaId,
        };
        if (contextInfo?.participant) {
            key.participant = contextInfo.participant;
            // Verifica che il partecipante abbia @s.whatsapp.net
            if (!key.participant.includes('@')) key.participant += '@s.whatsapp.net';
        }

        // Parsing tempo opzionale: .pin 7d, .pin 24h, .pin 30d
        let time = 86400; // default 24h
        if (!isUnpin && textArgs.trim()) {
            const match = textArgs.trim().match(/^(\d+)\s*(h|d|m)?$/i);
            if (match) {
                const val = parseInt(match[1]);
                const unit = (match[2] || 'h').toLowerCase();
                if (unit === 'h') time = val * 3600;
                else if (unit === 'd') time = val * 86400;
                else if (unit === 'm') time = val * 60;
                if (time > 7776000) time = 7776000; // max 90gg
                if (time < 3600) time = 3600; // min 1h
            } else {
                return reply("Formato tempo: .pin 24h / .pin 7d / .pin 30d");
            }
        }

        try {
            await sock.sendMessage(from, {
                pin: key,
                type: isUnpin ? 2 : 1,
                time,
            });
            const label = isUnpin ? '🔓 *Messaggio sfissato*' : `📌 *Messaggio fissato* (${time / 3600}h)`;
            await reply(label);
        } catch (e) {
            console.error('[pin] error:', e);
            await reply("❌ Errore nel fissare il messaggio.");
        }
    },
};
