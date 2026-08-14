'use strict';

const BF = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D56C + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D586 + cc - 97);
    return c;
}).join('');

const MS = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D670 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D68A + cc - 97);
    return c;
}).join('');

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

module.exports = {
    name: 'admin',
    aliases: ['admins', 'amministratori'],
    description: "Mostra amministratori del gruppo, del bot e comandi.",

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
                const line = `▸ 👤 _@${short}_`;
                if (isSuper) ownerList += line + ' 👑\n';
                else adminList += line + '\n';
            }

            // Bot owner/co-owner info
            let botAdmins = '';
            const owners = db._owners || [];
            const coowners = db._coowners || [];
            if (owners.length > 0) {
                botAdmins += owners.map(o => `▸ 👑 _${o.number}_`).join('\n') + '\n';
            }
            if (coowners.length > 0) {
                botAdmins += coowners.map(c => `▸ 🤝 _${c.number}_`).join('\n');
            }
            if (!botAdmins) botAdmins = '▸ _(nessuno)_';

            const txt =
`👑 *_ADMIN GRUPPO_*
━━━━━━━━━━━━━━━━━━
▸ 📛 _${groupName}_
▸ 👥 _${total}_ partecipanti
▸ 🛡️ _${admins.length}_ admin
${ownerList ? `━━━━━━━━━━━━━━━━━━\n👑 *Fondatori*\n${ownerList}\n` : ''}${adminList ? `━━━━━━━━━━━━━━━━━━\n⚙️ *Admin*\n${adminList}\n` : ''}━━━━━━━━━━━━━━━━━━
🤖 *BOT ADMIN*
${botAdmins}
━━━━━━━━━━━━━━━━━━
⚙️ *COMANDI ADMIN*
📢 .tag  📣 .tagall
🔒 .chiudi  🔓 .apri
🚫 .ban  🔗 .link
🗑️ .del  🔇 .mute/.unmute
⚠️ .warn  ✅ .unwarn
👑 .promote/.demote (.p/.d)
✅ .richieste accetta/rifiuta
🗣️ .say  🔗 .invito
⏸️ .pausa  ▶️ .riprendi
🛡️ .antivoip  🤖 .antibot
🔥 .antiflame  📋 .antilink
💼 .antiwzbusiness
🤬 .bestemmiometro on/off
━━━━━━━━━━━━━━━━━━
🛡️ *COMANDI OWNER*
⏻ .spegni  ⏼ .accendi
🔄 .riavvia  🤝 .cowner
🔗 .setlink  📋 .infobot
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`;

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
