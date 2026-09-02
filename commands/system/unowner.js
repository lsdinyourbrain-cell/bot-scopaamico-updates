'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

module.exports = {
    name: 'unowner',
    aliases: ['delowner', 'removeowner', 'togliowner'],
    description: "Rimuove un co-owner del bot (l'owner principale non si può rimuovere).",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, isOwner, mentioned, targetJid, isReply, contextInfo, reply, services } = context;
        const { db, sameJid, saveDB, ownerNumber } = services;

        if (!isOwner) return reply("Solo l'Owner può fare questo.");

        let target = mentioned[0] || targetJid || (isReply ? contextInfo?.participant : null);

        // Fallback: numero scritto come argomento
        if (!target && textArgs.trim()) {
            const num = textArgs.trim().replace(/\D/g, '');
            if (num.length >= 8) target = num + '@s.whatsapp.net';
        }

        if (!target) return reply("Tagga la persona, rispondi a un suo messaggio o scrivi il numero.");

        // Non permettere di rimuovere l'owner principale
        if (sameJid(target, ownerNumber) || sameJid(target, sock?.user?.id) || sameJid(target, sock?.user?.lid)) {
            return reply("⚠️ Non puoi rimuovere l'owner principale!");
        }

        if (!Array.isArray(db._owners) || db._owners.length === 0) {
            return reply("Non ci sono co-owner da rimuovere.");
        }

        // Trova la voce da rimuovere SOLO confrontando con il target indicato.
        // (la vecchia clausola sameJid(o.number, sock.user.id) abbinava sempre
        // l'owner principale in posizione 0, rimuovendo quello sbagliato)
        const index = db._owners.findIndex(o =>
            sameJid(o.number, target) || (o.lid && sameJid(o.lid, target))
        );

        if (index === -1) return reply("Questo utente non è tra i co-owner.");

        const removed = db._owners.splice(index, 1)[0];
        saveDB();

        const displayNum = (removed.number || removed.lid || target).split('@')[0];
        await sock.sendMessage(from, {
            text: `${sec('UNOWNER')}\n${boxOpen()}\n${line(`@${displayNum} non è più`)}\n${line('owner. 😔')}\n${line('I privilegi sono')}\n${line('stati revocati.')}\n${boxEnd()}`,
            mentions: [removed.number || removed.lid].filter(Boolean),
        }, { quoted: msg });
    },
};
