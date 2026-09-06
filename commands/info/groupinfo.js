'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'groupinfo',
    aliases: [],
    description: "Esegue il comando .groupinfo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, sendButtons, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) {
                return reply(
`${sec('GROUPINFO')}\n${boxOpen()}\n${line('Questo comando funziona solo')}\n${line('all\'interno di un _gruppo_. 👥')}\n${boxEnd()}`
                );
            }

            try {
                const meta         = await sock.groupMetadata(from);
                const participants = Array.isArray(meta.participants) ? meta.participants : [];
                const totalMembers = participants.length;

                // Separa superadmin (owner del gruppo) da admin normali
                const superAdmins = participants.filter(p => p.admin === 'superadmin');
                const admins      = participants.filter(p => p.admin === 'admin');

                // Costruisce le righe degli admin con icona di ruolo (usa il numero
                // di telefono reale quando disponibile: i @lid non si mostrano)
                const buildAdminLine = (p, icon) =>
                    `${icon} ▸ _@${dispOf(((p.phoneNumber || p.id || p.jid) || ''))}_`;

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
                    .map(p => p.phoneNumber || p.id || p.jid)
                    .filter(Boolean);

                const txt =
`${sec('INFORMAZIONI GRUPPO')}\n${boxOpen()}\n${line(`📛 Nome: _${meta.subject || 'N/D'}_`)}\n${line(`🆔 ID: _${from}_`)}\n${line(`📅 Creato: _${creation}_`)}\n${line(`👥 Membri: _${totalMembers}_`)}\n${line('📝 *Descrizione*')}\n${line(`_${desc}_`)}\n${line('👑 *Fondatore/SuperAdmin*')}\n${line(`${superAdminLines || '▸ _(nessuno)_'}`)}\n${line('⚙️ *Amministratori*')}\n${line(`${adminLines || '▸ _(nessuno)_'}`)}\n${boxEnd()}`;

                await sendButtons(sock, from, txt, [
                    { label: '🏠 Menu', id: 'menu' },
                    { label: '🔗 Link', id: 'link' },
                    { label: '👑 Admin', id: 'admin' },
                ], msg, adminMentions);

            } catch (e) {
                console.error('[groupinfo]', e.message);
                await reply("❌ Impossibile recuperare i dati del gruppo. Assicurati che il bot sia nel gruppo.");
            }
    },
};
