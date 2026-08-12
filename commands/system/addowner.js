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

        // Se il target è un LID, risolviamo il numero di telefono reale (via USync)
        // così l'owner viene riconosciuto anche se si presenta come PN. Salviamo
        // entrambi (number = numero reale o originale, lid = LID se presente).
        const resolved = { number: target, lid: target.includes('@lid') ? target : null };
        if (target.includes('@lid')) {
            try {
                const pn = await sock?.signalRepository?.lidMapping?.getPNForLID(target);
                if (pn) resolved.number = pn;
            } catch (_) {}
        }

        const exists = db._owners.some(o =>
            sameJid(o.number, resolved.number) ||
            (o.lid && sameJid(o.lid, resolved.lid)) ||
            (resolved.lid && sameJid(o.number, resolved.lid))
        );

        if (exists) return reply("Questo utente è già owner.");

        const now = new Date().toLocaleString('it-IT');
        db._owners.push({ number: resolved.number, lid: resolved.lid, addedAt: now });
        saveDB();

        const displayNum = resolved.number.split('@')[0];
        await sock.sendMessage(from, {
            text:
`👑 *ADDOWNER*
━━━━━━━━━━━━━━━━━━
@${displayNum} è ora owner!
aggiunto alle: ${now}
━━━━━━━━━━━━━━━━━━`,
            mentions: [resolved.number],
        }, { quoted: msg });
    },
};
