'use strict';

module.exports = {
    name: 'escludi',
    aliases: ['escludi-top', 'topexclude', 'escluditop'],
    description: "Esclude o riammette questo gruppo dalle classifiche (.top, .topricchi, .topgruppi).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isSenderAdmin, isOwner, reply, services } = context;
        const { db, saveDB } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin && !isOwner) return reply("⚠️ _[uso]:_ comando riservato agli admin del gruppo.");

        const q = String(textArgs || '').trim().toLowerCase();
        const esclusi = db._escludi || {};
        const current = Boolean(esclusi[from]);

        if (q && (q === 'on' || q === 'attiva' || q === 'si')) {
            if (current) return reply("🚫 Questo gruppo è già *escluso* dalle classifiche.");
            db._escludi = db._escludi || {};
            db._escludi[from] = true;
            saveDB();
            return reply(
`🚫 *GRUPPO ESCLUSO*
━━━━━━━━━━━━━━━━━━
▸ Questo gruppo non comparirà
  più nelle classifiche
  (.top, .topricchi, .topgruppi).
▸ L'attività continua a essere
  registrata normalmente.
━━━━━━━━━━━━━━━━━━
💡 \`.escludi off\` per riammetterlo.
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);
        }

        if (q && (q === 'off' || q === 'disattiva' || q === 'no')) {
            if (!current) return reply("✅ Questo gruppo è già *in classifica*.");
            db._escludi = db._escludi || {};
            delete db._escludi[from];
            saveDB();
            return reply(
`✅ *GRUPPO RIAMMESSO*
━━━━━━━━━━━━━━━━━━
▸ Questo gruppo torna nelle
  classifiche (.top, .topricchi,
  .topgruppi).
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);
        }

        return reply(
`🚫 *ESCLUSIONE CLASSIFICHE*
━━━━━━━━━━━━━━━━━━
▸ Stato: ${current ? '🚫 *ESCLUSO*' : '✅ *IN CLASSIFICA*'}
▸ \`.escludi on\`  → esclude il gruppo
▸ \`.escludi off\` → lo riammette
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);
    },
};