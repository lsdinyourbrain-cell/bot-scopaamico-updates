'use strict';

const xpLib = require('../../lib/xp');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'profilo',
    aliases: ['profila', 'profile'],
    description: "Mostra il profilo utente con statistiche.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCachedGroupMeta, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const target = targetJid || sender;
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const disp = (jid) => dispOf(jid, resolveJid(jid, meta));
            const uDB = getUser(target, from);
            // pushName è il nome di chi invia il comando: lo usiamo solo per il proprio profilo
            const isSelf = sameJid(target, sender);
            const name = isSelf ? (pushName || disp(target)) : disp(target);
            const wallet = uDB.money || 0;
            const bank = uDB.bank || 0;
            const msgCount = uDB.msgCount || 0;
            const spouse = uDB.spouse || null;
            const children = uDB.children?.length || 0;
            const parents = uDB.parents?.length || 0;

            // Livelli/XP (per-gruppo come tutto il resto del profilo)
            const level = uDB.level || 1;
            const xp = uDB.xp || 0;
            const xpNeed = xpLib.xpForNext(level);
            const pregi = Array.isArray(uDB.pregi) ? uDB.pregi : [];
            const lastPregi = pregi.slice(-3).map(p => (p && p.rank) || '☆').join(' · ');
            const bestemmie = uDB.bestemmie || 0;

            let pfpUrl;
            try { pfpUrl = await sock.profilePictureUrl(target, 'image'); } catch (_) { pfpUrl = null; }

            const profileText =
`👤 *_PROFILO_*
━━━━━━━━━━━━━━
▸ 🧑 _${name.slice(0, 20)}_
▸ 🏷️ ${uDB.title ? '*' + uDB.title.slice(0, 25) + '*' : '_Nessun titolo_'}
━━━━━━━━━━━━━━
▸ ⭐ Livello: _${level}_
▸ 🌟 Rango: _${xpLib.rankOf(level)}_
▸ ✨ XP: _${xp}_ / _${xpNeed}_
▸ ${xpLib.xpBar(xp, xpNeed)}
▸ 🏅 Pregi (ultimi): _${lastPregi || 'Nessuno'}_
▸ 🎓 Punti pregio: _${pregi.length}_
━━━━━━━━━━━━━━
▸ 💰 Contante: _${wallet}€_
▸ 🏦 Banca: _${bank}€_
▸ 💵 Totale: _${wallet + bank}€_
━━━━━━━━━━━━━━
▸ 💍 Sposato: ${spouse ? `@${disp(spouse)}` : '_No_'}
▸ 👴 Genitori: _${parents}_
▸ 🍼 Figli: _${children}_
━━━━━━━━━━━━━━
▸ 💬 Messaggi: _${msgCount}_
▸ 🤬 Bestemmie: _${bestemmie}_
◈ _Vex Bot_`;

            if (pfpUrl) {
                await sock.sendMessage(from, { image: { url: pfpUrl }, caption: profileText, mentions: spouse ? [spouse] : [] });
            } else {
                await sock.sendMessage(from, { text: profileText, mentions: spouse ? [spouse] : [] });
            }
    },
};
