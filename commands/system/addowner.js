'use strict';

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

module.exports = {
    name: 'addowner',
    aliases: ['setowner', 'cowner'],
    description: "Aggiunge un utente come owner del bot (privilegi identici all'owner principale).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, reply, services } = context;
        const { db, sameJid, saveDB, ownerNumber } = services;

        if (!isOwner) return reply("Solo l'Owner può fare questo.");

        let target = mentioned[0] || targetJid || (isReply ? contextInfo?.participant : null);

        // Fallback: accetta anche un numero scritto come argomento
        if (!target && textArgs.trim()) {
            const num = textArgs.trim().replace(/\D/g, '');
            if (num.length >= 8) target = num + '@s.whatsapp.net';
        }

        if (!target) return reply("Tagga la persona, rispondi a un suo messaggio o scrivi il numero.");

        if (!db._owners) db._owners = [];

        const exists = db._owners.some(o => sameJid(o.number, target));

        if (exists) return reply("Questo utente è già owner.");

        const now = new Date().toLocaleString('it-IT');
        db._owners.push({ number: target, addedAt: now });
        saveDB();

        await reply(
`╭─── ✦ ${SB('ADDOWNER')} ✦ ───╮
│                          │
│ 👑 @${target.split('@')[0]} è ora owner!  │
│                          │
│ aggiunto alle: ${now}     │
╰──────────────────────────╯`);
    },
};
