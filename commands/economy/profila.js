'use strict';

const xpLib = require('../../lib/xp');
const { dispOf, resolveJid } = require('../../lib/jid');
const { toStyle, STYLES } = require('../../lib/font');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

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
            if (!nick) return reply(`${sec('NICK')}\n${boxOpen()}\n${line('Uso: .profilo nick <nome>')}\n${boxEnd()}`);
            if (nick.length > 24) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Troppo lungo: max 24 caratteri.')}\n${boxEnd()}`);
            uDBSelf.nickname = nick;
            saveDB();
            return reply(`${sec('NICK IMPOSTATO')}\n${boxOpen()}\n${line(nick.slice(0, 24))}\n${boxEnd()}`);
        }
        if (sub === 'bio') {
            const bio = String(textArgs || '').replace(/^bio\s+/i, '').trim();
            if (!bio) return reply(`${sec('BIO')}\n${boxOpen()}\n${line('Uso: .profilo bio <testo>')}\n${boxEnd()}`);
            if (bio.length > 90) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Troppo lunga: max 90 caratteri.')}\n${boxEnd()}`);
            uDBSelf.bio = bio;
            saveDB();
            return reply(`${sec('BIO AGGIORNATA')}\n${boxOpen()}\n${line(bio.slice(0, 90))}\n${boxEnd()}`);
        }
        if (sub === 'stile' || sub === 'style') {
            const raw = String(textArgs || '').replace(/^stile\s+/i, '').replace(/^style\s+/i, '').trim().toLowerCase();
            if (!raw || raw === 'lista') {
                const lista = [...new Set(Object.values(STILE_ALIASES))];
                return reply(`${sec('STILI DISPONIBILI')}\n${boxOpen()}\n${line(lista.join(', '))}\n${boxEnd()}\n▸ .profilo stile <nome>`);
            }
            const styleKey = STILE_ALIASES[raw];
            if (!styleKey) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line(`Stile sconosciuto: ${raw}`)}\n${line('Vedi: .profilo stile lista')}\n${boxEnd()}`);
            uDBSelf.profileStyle = styleKey;
            saveDB();
            return reply(`${sec('PROFILO AGGIORNATO')}\n${boxOpen()}\n${line(`Nuovo stile: ${raw}`)}\n${boxEnd()}`);
        }
        if (sub === 'reset') {
            delete uDBSelf.nickname;
            delete uDBSelf.bio;
            delete uDBSelf.profileStyle;
            saveDB();
            return reply(`${sec('RESET')}\n${boxOpen()}\n${line('Nick, bio e stile azzerati.')}\n${boxEnd()}`);
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
`${sec('PROFILO')}
${boxOpen()}
${line(nameShown)}
${uDB.title ? line(`🏷️ ${String(uDB.title).slice(0, 25)}`) : ''}
${uDB.bio ? `\n💬 _"${String(uDB.bio).slice(0, 90)}"_\n` : ''}
${line('⭐ Livello ' + level + ' · ' + xpLib.rankOf(level))}
${line('✨ XP ' + xp + ' / ' + xpNeed)}
▸ ${xpLib.xpBar(xp, xpNeed)}
${line('🎓 Punti pregio ' + pregi.length + (lastPregi ? ' · ' + lastPregi : ''))}
${line('💰 Contante ' + wallet + '€')}
${line('🏦 Banca ' + bank + '€')}
${line('💵 Totale ' + (wallet + bank) + '€')}
${line('💍 Sposato/a → ' + (spouse ? `@${disp(spouse)}` : 'no'))}
${line('👴 Genitori ' + parents + ' · 🍼 Figli ' + children)}
${line('💬 Messaggi ' + msgCount)}
${line('🤬 Bestemmie ' + bestemmie)}
${boxEnd()}
${isSelf ? '▸ .profilo nick/bio/stile per personalizzare' : ''}`;

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
