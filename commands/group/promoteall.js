'use strict';

module.exports = {
    name: 'promoteall',
    aliases: ['tuttiadmin'],
    description: "Promuove tutti i membri non-admin a admin del gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sameJid, sendButtons } = services;

        if (!isGroup) return reply("❌ Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⛔ Solo gli admin del gruppo possono usarlo.");
        if (!isBotAdmin) return reply("❌ Prima rendimi admin, così posso promuovere.");

try {
            const meta = await sock.groupMetadata(from);
            const participants = meta?.participants || [];
            const botJid = sock.user?.id || sock.user?.lid || '';
            const adminSet = new Set(
                participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id || p.jid)
            );

            const target = participants
                .map(p => p.id || p.jid)
                .filter(Boolean)
                .filter(j => !adminSet.has(j))
                .filter(j => !sameJid(j, botJid));

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
━━━━━━━━━━━━━━━━━━
🎉 Promossi: *${target.length}* membri
✅ Tutti ora sono admin!
━━━━━━━━━━━━━━━━━━`;
            await sendButtons(sock, from, txt, [
                { label: '📋 Lista membri', id: 'list' },
            ], msg);
        } catch (e) {
            console.error('[promoteall]', e.message);
            await reply("❌ Errore: " + e.message);
        }
    },
};