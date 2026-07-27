'use strict';

module.exports = {
    name: 'admin',
    aliases: ['admins', 'amministratori'],
    description: "Mostra la lista degli amministratori del gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");

        try {
            const metadata = await sock.groupMetadata(from);
            const participants = metadata?.participants || [];
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const total = participants.length;
            const groupName = metadata.subject || 'Questo gruppo';

            let adminList = '';
            let ownerList = '';
            for (const a of admins) {
                const short = (a.id || a.jid || '').split('@')[0];
                const isSuper = a.admin === 'superadmin';
                const line = `┃ 👤 @${short}`;
                if (isSuper) ownerList += line + ' 👑\n';
                else adminList += line + '\n';
            }

            const txt =
`╭━━━━━━━ 👑 *AMMINISTRATORI* 👑 ━━━━━━━╮
┃                                     ┃
┃ 📛 *${groupName}*                    ┃
┃ 👥 *${total}* partecipanti           ┃
┃ 🛡️ *${admins.length}* amministratori ┃
┃                                     ┃
${ownerList ? `┃ ═══════ *FONDATORI* ═══════\n${ownerList}┃\n` : ''}${adminList ? `┃ ═══════ *ADMIN* ═══════\n${adminList}` : ''}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            const adminMentions = admins.map(a => a.id || a.jid).filter(Boolean);
            await sock.sendMessage(from, {
                text: txt,
                mentions: adminMentions,
            }, { quoted: msg });
        } catch (e) {
            console.error('[admin]', e.message);
            await reply("❌ Errore nel recupero della lista admin.");
        }
    },
};
