'use strict';

module.exports = {
    name: 'promoteall',
    aliases: ['tuttiadmin'],
    description: "Promuove tutti i membri non-admin a admin del gruppo.",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, isBotAdmin, reply, services } = context;
        const { db, sameJid, isOwnerJid, sendButtons } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin del gruppo possono usarlo.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ prima rendimi admin, così posso promuovere.");

        try {
            const meta = await sock.groupMetadata(from);
            const participants = meta?.participants || [];
            const botJid = sock.user?.id || sock.user?.lid || '';

            const jidOf = (p) => p.phoneNumber || p.id || p.jid;
            const adminSet = new Set(
                participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(jidOf)
            );

            const target = participants
                .map(jidOf)
                .filter(Boolean)
                .filter(j => !adminSet.has(j))
                .filter(j => !sameJid(j, botJid))
                .filter(j => !isOwnerJid(j, sock, db, null));

            if (!target.length) return reply("✅ Tutti sono già admin.");

            const CHUNK = 10;
            let done = 0;
            for (let i = 0; i < target.length; i += CHUNK) {
                const chunk = target.slice(i, i + CHUNK);
                await sock.groupParticipantsUpdate(from, chunk, 'promote');
                done += chunk.length;
                if (done < target.length) await new Promise(r => setTimeout(r, 1200));
            }

            const txt =
`👑 *PROMOTE ALL*
━━━━━━━━━━━━━━
🎉 Promossi: *${target.length}* membri
✅ Tutti ora sono admin!
━━━━━━━━━━━━━━
◈ _Vex Bot_`;
            await sendButtons(sock, from, txt, [
                { label: '📋 Lista membri', id: 'list' },
            ], msg);
        } catch (e) {
            console.error('[promoteall]', e.message);
            await reply("⚠️ _[uso]:_ errore: " + e.message);
        }
    },
};