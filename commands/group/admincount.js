'use strict';

module.exports = {
    name: 'admincount',
    aliases: ['contadm', 'admingroup', 'admincnt'],
    description: "Mostra il numero di admin nel gruppo.",

    async run(sock, msg, args, context) {
        const { from, isGroup, reply } = context;

        if (!isGroup) return reply("Non sei in un gruppo.");
        try {
            const meta = await sock.groupMetadata(from);
            const admins = meta.participants.filter(p => p.admin);
            const superAdmins = admins.filter(p => p.admin === 'superadmin');
            const regularAdmins = admins.filter(p => p.admin === 'admin');
            const total = meta.participants.length;

            await reply(
`📊 *ADMIN COUNT*
━━━━━━━━━━━━━━━━━━
${meta.subject}
👥 Membri: *${total}*
👑 Admin: *${admins.length}*
🟣 Super: *${superAdmins.length}*
🔵 Normal: *${regularAdmins.length}*
📱 Utenti: *${total - admins.length}*
━━━━━━━━━━━━━━━━━━`);
        } catch (_) {
            await reply("❌ Errore nel recuperare info gruppo.");
        }
    },
};
