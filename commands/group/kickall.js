'use strict';

module.exports = {
    name: 'kickall',
    aliases: ['espellitutti'],
    description: "Espelle tutti i membri tranne gli admin, il creatore e l'owner (richiede admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, sameJid, sendButtons } = services;

        if (!isGroup) return reply("❌ Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⛔ Solo gli admin del gruppo possono usarlo.");
        if (!isBotAdmin) return reply("❌ Prima rendimi admin, così posso espellere.");

        try {
            const meta = await sock.groupMetadata(from);
            const participants = meta?.participants || [];
            const botJid = sock.user?.id || sock.user?.lid || '';

            const protectedJids = new Set();
            for (const p of participants) {
                if (p.admin === 'admin' || p.admin === 'superadmin') protectedJids.add(p.id || p.jid);
            }
            protectedJids.add(meta.owner || '');
            if (db._owners?.length) db._owners.forEach(o => protectedJids.add(o));
            protectedJids.add(botJid);

            const target = participants
                .map(p => p.id || p.jid)
                .filter(Boolean)
                .filter(j => !protectedJids.has(j) && !sameJid(j, botJid));

            if (!target.length) return reply("✅ Nessuno da espellere: restano solo admin e owner.");

            const total = target.length;
            const CHUNK = 10;
            let done = 0;
            for (let i = 0; i < total; i += CHUNK) {
                const chunk = target.slice(i, i + CHUNK);
                await sock.groupParticipantsUpdate(from, chunk, 'remove');
                done += chunk.length;
                if (done < total) await new Promise(r => setTimeout(r, 1200));
            }

            const txt =
`🧹 *KICK ALL*
━━━━━━━━━━━━━━━━━━
👥 Espulsi: *${total}* membri
👑 Restano solo admin e owner
✅ Tutto fatto, fra!
━━━━━━━━━━━━━━━━━━`;
            await sendButtons(sock, from, txt, [
                { label: '📋 Lista membri', id: 'list' },
            ], msg);
        } catch (e) {
            console.error('[kickall]', e.message);
            await reply("❌ Errore: " + e.message);
        }
    },
};