'use strict';

module.exports = {
    name: 'groupinfo',
    aliases: [],
    description: "Esegue il comando .groupinfo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) {
                return reply(
`ℹ️ *GROUPINFO*
━━━━━━━━━━━━━━━━━━
Questo comando funziona solo
all'interno di un *gruppo*. 👥
━━━━━━━━━━━━━━━━━━`
                );
            }

            try {
                const meta         = await sock.groupMetadata(from);
                const participants = Array.isArray(meta.participants) ? meta.participants : [];
                const totalMembers = participants.length;

                // Separa superadmin (owner del gruppo) da admin normali
                const superAdmins = participants.filter(p => p.admin === 'superadmin');
                const admins      = participants.filter(p => p.admin === 'admin');

                // Costruisce le righe degli admin con icona di ruolo
                const buildAdminLine = (p, icon) =>
                    `${icon} @${(p.id || p.jid || '').split('@')[0]}`;

                const superAdminLines = superAdmins.map(p => buildAdminLine(p, '👑')).join('\n');
                const adminLines      = admins.map(p => buildAdminLine(p, '⚙️')).join('\n');

                // Descrizione: tronca se troppo lunga, placeholder se assente
                const rawDesc  = meta.desc || '';
                const desc     = rawDesc.trim()
                    ? rawDesc.trim().slice(0, 30) + (rawDesc.length > 30 ? '…' : '')
                    : '_Nessuna descrizione_';

                // Timestamp di creazione gruppo (Unix epoch → data leggibile)
                const creation = meta.creation
                    ? new Date(meta.creation * 1000).toLocaleDateString('it-IT', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })
                    : 'N/D';

                // Raccoglie tutti i JID admin per il parametro mentions
                const adminMentions = [...superAdmins, ...admins]
                    .map(p => p.id || p.jid)
                    .filter(Boolean);

                const txt =
`🏷️ *INFORMAZIONI GRUPPO*
━━━━━━━━━━━━━━━━━━
📛 Nome: ${meta.subject || 'N/D'}
🆔 ID: ${from}
📅 Creato: ${creation}
👥 Membri: ${totalMembers}
📝 *Descrizione:*
_${desc}_
👑 *Fondatore/SuperAdmin*
${superAdminLines || '_(nessuno)_'}
⚙️ *Amministratori*
${adminLines || '_(nessuno)_'}
━━━━━━━━━━━━━━━━━━`;

                // PFP del gruppo come allegato (fallback: solo testo)
                let pfpUrl;
                try { pfpUrl = await sock.profilePictureUrl(from, 'image'); } catch (_) { pfpUrl = null; }

                if (pfpUrl) {
                    await sock.sendMessage(from,
                        { image: { url: pfpUrl }, caption: txt, mentions: adminMentions },
                        { quoted: msg }
                    );
                } else {
                    await sock.sendMessage(from, { text: txt, mentions: adminMentions }, { quoted: msg });
                }

            } catch (e) {
                console.error('[groupinfo]', e.message);
                await reply("❌ Impossibile recuperare i dati del gruppo. Assicurati che il bot sia nel gruppo.");
            }
    },
};
