'use strict';

// Font Unicode per titoli sezioni
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
    name: 'menu',
    aliases: [],
    description: "Esegue il comando .menu.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        let pfpUrl;
        try { pfpUrl = await sock.profilePictureUrl(from, 'image'); } catch (_) { pfpUrl = null; }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });

        let menuTxt =
`╭── ✦ ${SB('SCOPAAMICO BOT')} v10.0 ✦ ──╮
│ 👤 ${pushName.slice(0, 14).padEnd(14)} 🕐 ${timeStr} ${dateStr}
├── 🆕 ${MS('NOVITÀ')} ─────────────────┤
│ ⚔️ .duello
│ 🎟️ .lotteria
│ 👤 .profilo
│ 🏁 .bandiera
│ ❓ .quiz
│ 💞 .compatibilita
│ 🦹 .ruba
│ 🏧 .deposita
│ 💳 .preleva
│ 📅 .daily
│ 🚫 .mute @utente
│ 🎁 .dona @utente
├── 💝 ${BF('FAMIGLIA')} ────────────────┤
│ .famiglia sposa|adotta|caccia|divorzia|abbandona
├── 🪙 ${SB('ECONOMIA')} ────────────────┤
│ 💰 .cassaforte
│ ⛏️ .scava
│ 🎰 .casino
│ 🎲 .dadi
│ 🎰 .slot
│ 🔴 .roulette
│ 🪨 .sasso
│ 📅 .daily
│ 🏧 .deposita
│ 💳 .preleva
│ 🦹 .ruba
│ ⚔️ .colpisci
│ 🎟️ .lotteria
│ 🏆 .top
│ 🤑 .ricchi
├── 🎲 ${MS('SOCIAL')} ─────────────────┤
│ 💞 .ship
│ 🏳️‍🌈 .gay
│ 💖 .simpatometro
│ 📊 .percentuale
│ 🤔 .scelta
│ 🌸 .fiore
│ 🦸 .personaggio
│ 📺 .anime
│ 🖥️ .assemblapc
│ 🤫 .verita
│ 🫣 .obbligo
│ 🔮 .oroscopo
│ 🐺 .maranza
├── 🔥 ${BF('INTERAZIONI')} ─────────────┤
│ 🖐️ .schiaffo
│ 😘 .bacia
│ 🫂 .abbraccia
│ 💍 .sposa
│ 🍑 .paccasulculo
│ 🔪 .uccidi
│ 🤬 .insulta
│ 🔞 .scopa
│ 💦 .sborra
│ 👉👌 .ditalino
│ 🍆 .sega
│ 🤰 .incinta
│ 🍒 .tette
│ 😂 .meme
│ 🥊 .rissa
│ 🍆 .cazzo
│ 🤪 .sclero
│ 🍹 .drink
│ 🙏 .scusa
│ 🪵 .palo
│ 🗣️ .gossip
├── 🛠️ ${SB('UTILITY')} ────────────────┤
│ 👤 .profilo
│ 👑 .admin
│ 📡 .ping
│ ℹ️ .groupinfo
│ 🌤️ .weather
│ 🎨 .sticker
│ 📹 .vv
│ 💻 .hack
│ 👥 .clona
│ 🔊 .tts
│ 🐿️ .chipmunk
│ 🏃 .rubato
│ 🎵 .lyrics
├── 🎤 ${MS('AUDIO')} ───────────────────┤
│ 🎙️ .deep
│ 🔄 .reverse
│ 🗣️ .echo
│ 🤖 .robot
│ 🥴 .drunk
│ 🔊 .bass
│ 🌙 .nightcore
│ 🔮 .8d
├── 📥 ${BF('MEDIA')} ───────────────────┤
│ 📸 .ig
│ 💀 .wasted
│ 📖 .pokedex
│ 🤡 .clown
├── 🤖 ${SB('AI')} ──────────────────────┤
│ 🧠 .ai [domanda]
├── 🎮 ${MS('GIOCHI')} ─────────────────┤
│ ❓ .quiz
│ 🏁 .bandiera
│ 💞 .compatibilita
│ ⚔️ .duello @utente [puntata]
├── ⚙️ ${BF('ADMIN')} ───────────────────┤
│ 📢 .tag
│ 📣 .tagall
│ 🔒 .chiudi
│ 🔓 .apri
│ 🚫 .ban
│ 🔗 .link
│ 🗑️ .del
│ 🔇 .mute
│ 🔊 .unmute
│ ⚠️ .warn
│ ✅ .unwarn
│ 👑 .promote
│ 👑 .demote
│ ✅ .accettarichieste
│ 🗣️ .say
│ 🔗 .invito
│ ⏸️ .pausa
│ ▶️ .riprendi`;

        if (isGroup) {
            const alCfg = getAntilinkGroup(from);
            const keys = Object.keys(ANTILINK_PLATFORMS);
            const alLines = keys.map(p => `│ ${alCfg[p] ? '🟢' : '🔴'} .antilink ${p}`).join('\n');
            menuTxt +=
`├── 🔗 ${SB('ANTILINK')} ────────────────┤
${alLines}
│ 🟢.antilink tutti on/off`;
        }

        if (isOwner) {
            menuTxt +=
`├── 🛡 ${MS('OWNER')} ───────────────────┤
│ ⏻ .spegni
│ ⏼ .accendi
│ 🔄 .riavvia
│ 👋 .welcome on
│ 👋 .welcome off
│ 👋 .goodbye on
│ 👋 .goodbye off
│ 🔗 .setlink <url>`;
        }

        const SP = db._config?.sponsorLink || 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo?s=cl&p=a&ilr=0';
        menuTxt +=
`├── 🌟 ${BF('SPONSOR')} ────────────────┤
│ Unisciti al gruppo ufficiale! 🫶
│ ${SP}
╰───────────────────────────────────╯`;

        if (pfpUrl) {
            await sock.sendMessage(from,
                { image: { url: pfpUrl }, caption: menuTxt },
                { quoted: msg }
            );
        } else {
            await reply(menuTxt);
        }
    },
};
