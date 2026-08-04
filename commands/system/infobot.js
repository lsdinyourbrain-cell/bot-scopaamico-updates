'use strict';

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    if (cc >= 48 && cc <= 57) return String.fromCodePoint(0x1D7E2 + cc - 48);
    return c;
}).join('');
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

module.exports = {
    name: 'infobot',
    aliases: ['botinfo', 'about'],
    description: "Mostra informazioni sul bot, owner e owner aggiuntivi.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, ownerNumber } = services;

        const owners = db._owners || [];

        // Numero REALE dell'owner principale: il bot gira sull'account dell'owner,
        // quindi sock.user.id è il numero di telefono vero (PN). Se manca, ripiega
        // sull'ID salvato in ownerNumber.
        const botPn = sock?.user?.id ? sock.user.id.split(':')[0].split('@')[0] : '';
        const ownerPhone = botPn || (ownerNumber ? ownerNumber.split('@')[0] : 'Sconosciuto');
        const ownerPhoneLabel = ownerNumber && ownerNumber.includes('@lid') && botPn
            ? `${ownerPhone} (ID interno: ${ownerNumber.split('@')[0]})`
            : ownerPhone;
        const totalOwners = owners.length + 1;

        // Converte un jid (@lid o @s.whatsapp.net) nel numero di telefono reale.
        // getPNForLID interroga WhatsApp (USync) e può fallire: in tal caso mostra l'ID.
        const displayOwnerNumber = async (jid) => {
            if (!jid) return 'Sconosciuto';
            const num = jid.split('@')[0];
            if (!jid.includes('@lid')) return num;
            try {
                const pn = await sock?.signalRepository?.lidMapping?.getPNForLID(jid);
                if (pn) return pn.split('@')[0];
            } catch (_) {}
            return num;
        };

        // Genera frasi casuali
        const phrases = [
            "✨ *SCOPAAMICO BOT* — il bot che ti scopa.. Amico! 🫶",
            "🔥 Creato per dominare i gruppi WhatsApp con stile!",
            "🤖 Dal 2024 in servizio, sempre più forte 💪",
            "⚡ Fatto con amore (e bestemmie) da un vero italiano 🍝",
            "💀 Se mi tagghi, rispondo. Se mi ignori, ti ignoro. Semplice.",
            "🛡️ Proteggo il gruppo, amministro, e ti faccio anche compagnia.",
            "🎯 Preciso come un colpo di fucile, veloce come un insulto di nonna.",
            "🚀 Versione 11.0 — sempre più aggiornato, sempre più scam.",
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

        const now = new Date();
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

        let txt =
`╭━━━━ ✦ ${SB('INFO BOT')} ✦ ━━━━╮
┃                            ┃
┃  ${randomPhrase}
┃                            ┃
┃  ${MS('🕐 Info richiesta')}
┃    📅 ${dateStr}
┃    🕒 ${timeStr}
┃    👤 ${pushName}
┃
┣━━━━━━ ${BF('CONTATTI')} ━━━━━━┫
┃
┃  👑 ${SB('OWNER PRINCIPALE')}
┃     📱 ${ownerPhoneLabel}
┃`;

        if (owners.length > 0) {
            txt += `┃\n┃  👑 ${MS('ALTRI OWNER')} (${owners.length})\n`;
            const resolved = await Promise.all(owners.map(async o => ({
                real: await displayOwnerNumber(o.number || o.lid),
                date: o.addedAt || 'sconosciuta',
            })));
            for (const r of resolved) {
                txt += `┃     📱 ${r.real} — dal ${r.date}\n`;
            }
            txt += '┃';
        }

        txt += `┃\n┃  👥 ${SB('TOTALE OWNER')}: ${totalOwners}\n`;

        const totalUsers = Object.keys(db).filter(k => k.endsWith('@g.us') || k.endsWith('@s.whatsapp.net')).length;
        txt +=
`┃
┃  📊 ${SB('STATISTICHE')}
┃     👥 Chat tracciate: ${totalUsers}
┃     💾 DB: ${(JSON.stringify(db).length / 1024).toFixed(1)} KB
┃
┣━━━━━━ ${BF('COMANDI')} ━━━━━━━┫
┃
┃  Premi il pulsante per aprire
┃  il menu completo! 🚀
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await reply(txt);
    },
};
