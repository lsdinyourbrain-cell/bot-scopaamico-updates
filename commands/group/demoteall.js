'use strict';

module.exports = {
    name: 'demoteall',
    aliases: ['tuttimembri', 'unadminall'],
    description: "Toglie l'admin a tutti, tranne al creatore del gruppo e all'owner.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, sameJid, sendButtons } = services;

        if (!isGroup) return reply("❌ Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⛔ Solo gli admin del gruppo possono usarlo.");
        if (!isBotAdmin) return reply("❌ Prima rendimi admin, così posso retrocedere.");

        try {
            const meta = await sock.groupMetadata(from);
            const participants = meta?.participants || [];
            const botJid = sock.user?.id || sock.user?.lid || '';

            const protectedJids = new Set();
            protectedJids.add(meta.owner || '');
            if (db._owners?.length) db._owners.forEach(o => protectedJids.add(o));
            protectedJids.add(botJid);

            const target = participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id || p.jid)
                .filter(Boolean)
                .filter(j => !protectedJids.has(j))
                .filter(j => !sameJid(j, botJid));

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
━━━━━━━━━━━━━━━━━━
🔄 Retrocessi: *${target.length}* admin
👑 Restano il creatore
e l'owner
✅ Operazione completata!
━━━━━━━━━━━━━━━━━━`;
            await sendButtons(sock, from, txt, [
                { label: '📋 Lista membri', id: 'list' },
            ], msg);
        } catch (e) {
            console.error('[demoteall]', e.message);
            await reply("❌ Errore: " + e.message);
        }
    },
};