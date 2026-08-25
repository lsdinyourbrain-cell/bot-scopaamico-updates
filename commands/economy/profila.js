'use strict';

const xpLib = require('../../lib/xp');
const { dispOf, resolveJid } = require('../../lib/jid');
const { toStyle, STYLES } = require('../../lib/font');

const SEP = '✦ ✦ ✦';
// Stili disponibili per la personalizzazione del profilo
const STILE_ALIASES = {
    gothic: 'gothic', gotico: 'gothic',
    script: 'script', corsivo: 'script',
    scriptbold: 'scriptBold', elegante: 'scriptBold',
    outline: 'outline', doppio: 'outline',
    serifbold: 'serifBold', serif: 'serifBold',
    sansbold: 'sansBold', sans: 'sansBold', grassetto: 'sansBold',
    mono: 'mono', monospace: 'mono',
    smallcaps: 'smallcaps', maiuscoletto: 'smallcaps',
    fullwidth: 'fullwidth', vaporwave: 'fullwidth',
    circled: 'circled', cerchiato: 'circled',
    fraktur: 'fraktur',
};

module.exports = {
    name: 'profilo',
    aliases: ['profila', 'profile'],
    description: "Mostra il profilo utente con statistiche. Personalizzabile: .profilo nick/bio/stile/reset",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCachedGroupMeta, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        const sub = String(args[0] || '').toLowerCase();
        const uDBSelf = getUser(sender, from);

        // ══ PERSONALIZZAZIONE ═════════════════════════════════════════════
        if (sub === 'nick' || sub === 'nickname') {
            const nick = String(textArgs || '').replace(/^nick(name)?\s+/i, '').trim();
            if (!nick) return reply(`🏷️ *${T2('Nick', uDBSelf.profileStyle)}*\n${SEP}\n▸ Uso: _.profilo nick <nome>_`);
            if (nick.length > 24) return reply(`❌ Troppo lungo: max *24* caratteri.`);
            uDBSelf.nickname = nick;
            saveDB();
            return reply(`✅ *${T2('Fatto', uDBSelf.profileStyle)}*\n${SEP}\n▸ Nick impostato:\n▸ *${nick.slice(0, 24)}*`);
        }
        if (sub === 'bio') {
            const bio = String(textArgs || '').replace(/^bio\s+/i, '').trim();
            if (!bio) return reply(`📝 *${T2('Bio', uDBSelf.profileStyle)}*\n${SEP}\n▸ Uso: _.profilo bio <testo>_`);
            if (bio.length > 90) return reply(`❌ Troppo lunga: max *90* caratteri.`);
            uDBSelf.bio = bio;
            saveDB();
            return reply(`✅ *${T2('Fatto', uDBSelf.profileStyle)}*\n${SEP}\n▸ Bio aggiornata.`);
        }
        if (sub === 'stile' || sub === 'style') {
            const raw = String(textArgs || '').replace(/^stile\s+/i, '').replace(/^style\s+/i, '').trim().toLowerCase();
            if (!raw || raw === 'lista') {
                const lista = [...new Set(Object.values(STILE_ALIASES))];
                return reply(`🎨 *${T2('Stili disponibili', uDBSelf.profileStyle)}*\n${SEP}\n▸ ${lista.join(', ')}\n\n▸ Uso: _.profilo stile <nome>_`);
            }
            const styleKey = STILE_ALIASES[raw];
            if (!styleKey) return reply(`❌ Stile sconosciuto: *${raw}*\n▸ Vedi i nomi con _.profilo stile lista_`);
            uDBSelf.profileStyle = styleKey;
            saveDB();
            return reply(`✅ ${toStyle('PROFILO AGGIORNATO', styleKey)}\n${SEP}\n▸ Nuovo stile: *${raw}*`);
        }
        if (sub === 'reset') {
            delete uDBSelf.nickname;
            delete uDBSelf.bio;
            delete uDBSelf.profileStyle;
            saveDB();
            return reply(`🧹 *${T2('Reset', uDBSelf.profileStyle)}*\n${SEP}\n▸ Nick, bio e stile azzerati.`);
        }

        // ══ VISUALIZZAZIONE PROFILO ═══════════════════════════════════════
        const target = targetJid || sender;
        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));
        const uDB = getUser(target, from);
        // pushName è il nome di chi invia il comando: lo usiamo solo per il proprio profilo
        const isSelf = sameJid(target, sender);
        const baseName = isSelf ? (uDB.nickname || pushName || disp(target)) : (uDB.nickname || disp(target));
        const style = STYLES[uDB.profileStyle] ? uDB.profileStyle : null;
        const nameShown = style ? toStyle(baseName.slice(0, 20), style) : `*${baseName.slice(0, 20)}*`;
        const headTitle = T2('Profilo', uDB.profileStyle);
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
`${headTitle} 🪪
${SEP}
▸ ${nameShown}
${uDB.title ? `▸ 🏷️ _${String(uDB.title).slice(0, 25)}_` : ''}
${uDB.bio ? `\n💬 _"${String(uDB.bio).slice(0, 90)}"_\n` : ''}
${T2('Livelli', uDB.profileStyle)}
▸ ⭐ Livello *${level}* · 🌟 _${xpLib.rankOf(level)}_
▸ ✨ XP *${xp}* / *${xpNeed}*
▸ ${xpLib.xpBar(xp, xpNeed)}
▸ 🎓 Punti pregio *${pregi.length}* ${lastPregi ? `· _${lastPregi}_` : ''}

${T2('Soldi', uDB.profileStyle)}
▸ 💰 Contante *_${wallet}€_*
▸ 🏦 Banca *_${bank}€_*
▸ 💵 Totale *_${wallet + bank}€_*

${T2('Famiglia', uDB.profileStyle)}
▸ 💍 Sposato/a → ${spouse ? `@${disp(spouse)}` : '_no_'}
▸ 👴 Genitori *_${parents}_* · 🍼 Figli *_${children}_*

${T2('Attività', uDB.profileStyle)}
▸ 💬 Messaggi *_${msgCount}_*
▸ 🤬 Bestemmie *_${bestemmie}_*
${SEP}
${isSelf ? '▸ ✏️ Personalizza: _.profilo nick/bio/stile_' : ''}
◈ _Vex Bot_`;

        if (pfpUrl) {
            await sock.sendMessage(from, { image: { url: pfpUrl }, caption: profileText, mentions: spouse ? [spouse] : [] });
        } else {
            await sock.sendMessage(from, { text: profileText, mentions: spouse ? [spouse] : [] });
        }
    },
};

// Titolo sezione nello stile scelto dall'utente (default: corsivo elegante)
function T2(s, styleKey) {
    return toStyle(String(s).toUpperCase(), STYLES[styleKey] ? styleKey : 'scriptBold');
}
