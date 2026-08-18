'use strict';

module.exports = {
    name: 'demoteall',
    aliases: ['tuttimembri', 'unadminall'],
    description: "Toglie l'admin a tutti, tranne al creatore del gruppo e all'owner.",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, isBotAdmin, reply, services } = context;
        const { db, sameJid, isOwnerJid, sendButtons } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin del gruppo possono usarlo.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ prima rendimi admin, così posso retrocedere.");

        try {
            const meta = await sock.groupMetadata(from);
            const participants = meta?.participants || [];
            const botJid = sock.user?.id || sock.user?.lid || '';

            const jidOf = (p) => p.phoneNumber || p.id || p.jid;

            const target = participants
                // I superadmin (creatore del gruppo) non vanno mai toccati
                .filter(p => p.admin === 'admin')
                .map(jidOf)
                .filter(Boolean)
                .filter(j => !sameJid(j, botJid))
                .filter(j => !isOwnerJid(j, sock, db, null));

            if (!target.length) return reply("✅ Nessun admin da retrocedere.");

            const CHUNK = 10;
            let done = 0;
            for (let i = 0; i < target.length; i += CHUNK) {
                const chunk = target.slice(i, i + CHUNK);
                await sock.groupParticipantsUpdate(from, chunk, 'demote');
                done += chunk.length;
                if (done < target.length) await new Promise(r => setTimeout(r, 1200));
            }

            const txt =
`⬇️ *DEMOTE ALL*
━━━━━━━━━━━━━━
🔄 Retrocessi: *${target.length}* admin
👑 Restano il creatore
e l'owner
✅ Tutto fatto, fra!
━━━━━━━━━━━━━━
◈ _Vex Bot_`;
            await sendButtons(sock, from, txt, [
                { label: '📋 Lista membri', id: 'list' },
            ], msg);
        } catch (e) {
            console.error('[demoteall]', e.message);
            await reply("⚠️ _[uso]:_ errore: " + e.message);
        }
    },
};