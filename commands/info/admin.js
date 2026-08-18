'use strict';

const { toDecorated } = require('../../lib/font');
const { dispOf } = require('../../lib/jid');

module.exports = {
    name: 'admin',
    aliases: ['admins', 'amministratori'],
    description: "Mostra gli amministratori del gruppo, i fondatori e i comandi admin/owner.",

    async run(sock, msg, args, context) {
        const { from, reply, services } = context;
        const { db, sendButtons } = services;

        if (!from || !from.endsWith('@g.us')) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");

        try {
            const metadata = await sock.groupMetadata(from);
            const participants = Array.isArray(metadata?.participants) ? metadata.participants : [];
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const total = participants.length;
            const groupName = metadata.subject || 'Questo gruppo';

            const jidOf = (p) => p?.phoneNumber || p?.id || p?.jid;
            const owners = admins.filter(a => a.admin === 'superadmin');
            const normals = admins.filter(a => a.admin === 'admin');

            const ownerList = owners.length
                ? owners.map(a => `▸ 👑 _@${dispOf(jidOf(a))}_`).join('\n')
                : '▸ _(nessuno)_';
            const adminList = normals.length
                ? normals.map(a => `▸ ⚙️ _@${dispOf(jidOf(a))}_`).join('\n')
                : '▸ _(nessuno)_';

            // Owner/co-owner del bot
            const botOwners = (db._owners || []);
            const botCo = (db._coowners || []);
            let botAdmins = '';
            if (botOwners.length) botAdmins += botOwners.map(o => `▸ 👑 _@${dispOf(o.number || o.lid || '')}_`).join('\n') + '\n';
            if (botCo.length) botAdmins += botCo.map(c => `▸ 🤝 _@${dispOf(c.number || c.lid || '')}_`).join('\n');
            if (!botAdmins) botAdmins = '▸ _(nessuno)_';

            const txt =
`🛡️ ${toDecorated('ADMIN', 'gothic', '◈')}
━━━━━━━━━━━━━━━━━━
▸ 📛 _${groupName}_
▸ 👥 _${total}_ partecipanti
▸ 🛡️ _${admins.length}_ admin
━━━━━━━━━━━━━━━━━━
👑 *Fondatori*
${ownerList}
━━━━━━━━━━━━━━━━━━
⚙️ *Admin del gruppo*
${adminList}
━━━━━━━━━━━━━━━━━━
🤖 *Owner del bot*
${botAdmins}
━━━━━━━━━━━━━━━━━━
💡 Comandi admin: \`.tagall\`,
\`.promote\`, \`.demote\`, \`.ban\`,
\`.kick\`, \`.warn\`, \`.mute\`,
\`.evento\`, \`.registro\`...
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`;

            const mentionJids = admins.map(jidOf).filter(Boolean).slice(0, 15);
            await sendButtons(sock, from, txt, [
                { label: '📜 Registro modifiche', id: 'registro' },
                { label: '👥 Lista membri', id: 'list' },
            ], msg).catch(() => sock.sendMessage(from, { text: txt, mentions: mentionJids }, { quoted: msg }));
        } catch (e) {
            console.error('[admin]', e.message);
            await reply("❌ Errore nel recupero della lista admin.");
        }
    },
};