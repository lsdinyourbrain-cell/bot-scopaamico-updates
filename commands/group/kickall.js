'use strict';

module.exports = {
    name: 'kickall',
    aliases: ['espellitutti'],
    description: "Espelle tutti i membri tranne gli admin, il creatore e l'owner (richiede admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isSenderAdmin, isBotAdmin, reply, services } = context;
        const { db, sameJid, isOwnerJid, sendButtons } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin del gruppo possono usarlo.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ prima rendimi admin, così posso espellere.");

        try {
            const meta = await sock.groupMetadata(from);
            const participants = meta?.participants || [];
            const botJid = sock.user?.id || sock.user?.lid || '';

            const jidOf = (p) => p.phoneNumber || p.id || p.jid;
            const protectedJids = new Set();
            for (const p of participants) {
                if (p.admin === 'admin' || p.admin === 'superadmin') protectedJids.add(jidOf(p));
            }
            if (meta.owner) protectedJids.add(meta.owner);
            protectedJids.add(botJid);

            const target = participants
                .map(jidOf)
                .filter(Boolean)
                .filter(j => !protectedJids.has(j))
                .filter(j => !sameJid(j, botJid))
                .filter(j => !isOwnerJid(j, sock, db, null));

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
━━━━━━━━━━━━━━
👥 Espulsi: *${total}* membri
👑 Restano solo admin e owner
✅ Tutto fatto, fra!
━━━━━━━━━━━━━━
◈ _Vex Bot_`;
            await sendButtons(sock, from, txt, [
                { label: '📋 Lista membri', id: 'list' },
            ], msg);
        } catch (e) {
            console.error('[kickall]', e.message);
            await reply("⚠️ _[uso]:_ errore: " + e.message);
        }
    },
};