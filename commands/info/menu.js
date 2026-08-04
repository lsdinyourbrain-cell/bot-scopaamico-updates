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

// Formatta una riga: emoji + comando stilizzato in unicode
const L = (emoji, cmd, extra = '') => `│ ${emoji} ${SB(cmd)}${extra ? ' ' + extra : ''}`;
const H = (emoji, title, width = 26) => {
    const t = `${emoji} ${title} `;
    const filler = '─'.repeat(Math.max(1, width - t.length));
    return `├──${t}${filler}┤`;
};

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Mostra l'elenco dei comandi disponibili.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        let pfpUrl;
        try { pfpUrl = await sock.profilePictureUrl(from, 'image'); } catch (_) { pfpUrl = null; }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });

        let menuTxt =
`╭── ✦ ${SB('SCOPAMICO BOT')} v11.4 ✦ ──╮
│ 👤 ${pushName.slice(0, 14).padEnd(14)} 🕐 ${timeStr} ${dateStr}
├── 🆕 ${MS('NOVITÀ v11.4')} ─────┤
${L('🆔', '.id')}
${L('🎯', '.pick')}
${L('🧮', '.calc')}
${L('😂', '.joke')}
${L('🧠', '.fact')}
${L('🔐', '.password')}
${L('🔢', '.base64')}
${L('🔣', '.hex')}
${L('📊', '.count')}
${L('👑', '.admin', '[rivisto]')}
${L('🛡️', '.antivoip')}
${L('💼', '.antiwzbusiness')}
${L('🔥', '.antiflame')}
${L('🤖', '.antibot')}
${L('🤬', '.bestemmiometro')}
${L('🤝', '.cowner')}
${L('📋', '.infobot')}
${L('🔗', '.setlink')}
├── 💝 ${BF('FAMIGLIA')} ─────────┤
│ .famiglia sposa|adotta|caccia
│ |divorzia|abbandona
├── 🪙 ${SB('ECONOMIA')} ─────────┤
${L('💰', '.cassaforte')}
${L('⛏️', '.scava')}
${L('🎰', '.casino')}
${L('🎲', '.dadi')}
${L('🎰', '.slot')}
${L('🔴', '.roulette')}
${L('🪨', '.sasso')}
${L('📅', '.daily')}
${L('🏧', '.deposita')}
${L('💳', '.preleva')}
${L('🦹', '.ruba')}
${L('⚔️', '.colpisci')}
${L('🎟️', '.lotteria')}
${L('🏆', '.top')}
${L('🤑', '.ricchi')}
├── 🎲 ${MS('SOCIAL')} ───────────┤
${L('💞', '.ship')}
${L('🏳️‍🌈', '.gay')}
${L('💖', '.simpatometro')}
${L('📊', '.percentuale')}
${L('🤔', '.scelta')}
${L('🌸', '.fiore')}
${L('🦸', '.personaggio')}
${L('📺', '.anime')}
${L('🖥️', '.assemblapc')}
${L('🤫', '.verita')}
${L('🫣', '.obbligo')}
${L('🔮', '.oroscopo')}
${L('🐺', '.maranza')}
├── 🔥 ${BF('INTERAZIONI')} ──────┤
${L('🖐️', '.schiaffo')}
${L('😘', '.bacia')}
${L('🎯', '.pick')}
${L('🪙', '.flip')}
${L('🎱', '.8ball')}
${L('📊', '.rate')}
${L('🤔', '.wyr')}
${L('💭', '.quote')}
${L('🫂', '.abbraccia')}
${L('💍', '.sposa')}
${L('🍑', '.paccasulculo')}
${L('🔪', '.uccidi')}
${L('🤬', '.insulta')}
${L('🔞', '.scopa')}
${L('💦', '.sborra')}
${L('👉👌', '.ditalino')}
${L('🍆', '.sega')}
${L('🤰', '.incinta')}
${L('🍒', '.tette')}
${L('😂', '.meme')}
${L('🥊', '.rissa')}
${L('🍆', '.cazzo')}
${L('🤪', '.sclero')}
${L('🍹', '.drink')}
${L('🙏', '.scusa')}
${L('🪵', '.palo')}
${L('🗣️', '.gossip')}
├── 🛠️ ${SB('UTILITY')} ──────────┤
${L('👤', '.profilo')}
${L('👑', '.admin')}
${L('📡', '.ping')}
${L('ℹ️', '.groupinfo')}
${L('🌤️', '.weather')}
${L('🆔', '.id')}
${L('🧮', '.calc')}
${L('🔢', '.base64')}
${L('🔣', '.hex')}
${L('📊', '.count')}
${L('🔐', '.password')}
${L('🎨', '.sticker')}
${L('📹', '.vv')}
${L('💻', '.hack')}
${L('👥', '.clona')}
${L('🔊', '.tts')}
${L('🐿️', '.chipmunk')}
${L('🏃', '.rubato')}
${L('🎵', '.lyrics')}
├── 🎤 ${MS('AUDIO')} ─────────────┤
${L('🎙️', '.deep')}
${L('🔄', '.reverse')}
${L('🗣️', '.echo')}
${L('🤖', '.robot')}
${L('🥴', '.drunk')}
${L('🔊', '.bass')}
${L('🌙', '.nightcore')}
${L('🔮', '.8d')}
├── 📥 ${BF('MEDIA')} ─────────────┤
${L('📸', '.ig')}
${L('💀', '.wasted')}
${L('📖', '.pokedex')}
${L('🤡', '.clown')}
├── 🤖 ${SB('AI')} ────────────────┤
${L('🧠', '.ai', '[domanda]')}
├── 🎮 ${MS('GIOCHI')} ────────────┤
${L('❓', '.quiz')}
${L('🏁', '.bandiera')}
${L('💞', '.compatibilita')}
${L('⚔️', '.duello', '@utente [puntata]')}
${L('🎯', '.indovina', '[numero] [puntata]')}
${L('🪙', '.testa', 'testa|croce [puntata]')}
${L('🎲', '.parita', 'pari|dispari [puntata]')}
${L('🃏', '.alta', 'alta|bassa [puntata]')}
${L('🃏', '.blackjack', '[puntata] [hit]')}
${L('🎡', '.ruota', '[puntata]')}
${L('🎟️', '.gratta')}
${L('⚡', '.reazione')}
${L('🧩', '.parola')}
${L('🧠', '.memoria')}
├── 🛡️ ${BF('SICUREZZA')} ─────────┤
${L('🛡️', '.antivoip', 'on/off')}
${L('💼', '.antiwzbusiness', 'on/off')}
${L('🔥', '.antiflame', 'on/off')}
${L('🤖', '.antibot', 'on/off')}
${L('📋', '.antilink', 'on/off')}
${L('🤬', '.bestemmiometro', 'on/off')}
├── ⚙️ ${BF('ADMIN')} ─────────────┤
${L('📢', '.tag')}
${L('📣', '.tagall')}
${L('🔒', '.chiudi')}
${L('🔓', '.apri')}
${L('🚫', '.ban')}
${L('🔗', '.link')}
${L('🗑️', '.del')}
${L('🔇', '.mute')}
${L('🔊', '.unmute')}
${L('⚠️', '.warn')}
${L('👑', '.promote')}
${L('👑', '.demote')}
${L('✅', '.accettarichieste')}
${L('🗣️', '.say')}
${L('🔗', '.invito')}
${L('⏸️', '.pausa')}
${L('▶️', '.riprendi')}
├── 📋 ${BF('GESTIONE')} ──────────┤
${L('📛', '.setname', '<nome>')}
${L('📝', '.setdesc', '<testo>')}
${L('🔄', '.revoke')}
${L('👑', '.tagadmin')}
${L('📋', '.list')}
${L('🖼️', '.seticon', '(reply a img)')}
${L('🏞️', '.grouppic')}
${L('➕', '.add', '<numero>')}
${L('🚪', '.kick', '@utente')}
${L('👋', '.leave')}
${L('👑', '.admincount')}
${L('⏳', '.ephemeral', 'on/off')}
${L('⚠️', '.warnlist')}
${L('✅', '.resetwarns', '@utente')}
${L('📌', '.pin', '(reply msg)')}
├── 🗂️ ${MS('STATO')} ─────────────┤
${L('📊', '.status')}
${L('📦', '.groups')}`;

        if (isGroup) {
            const alCfg = getAntilinkGroup(from);
            const keys = Object.keys(ANTILINK_PLATFORMS);
            const alLines = keys.map(p => `│ ${alCfg[p] ? '🟢' : '🔴'} ${SB('.antilink')} ${p}`).join('\n');
            menuTxt +=
`├── 🔗 ${SB('ANTILINK')} ──────────┤
${alLines}
│ 🟢 ${SB('.antilink')} tutti on/off`;
        }

        if (isOwner) {
            menuTxt +=
`├── 🛡 ${MS('OWNER')} ──────────────┤
${L('⏻', '.spegni')}
${L('⏼', '.accendi')}
${L('🔄', '.riavvia')}
${L('👋', '.welcome', 'on/off')}
${L('👋', '.goodbye', 'on/off')}
${L('🔗', '.setlink', '<url>')}
${L('👑', '.addowner', '@utente')}
${L('🗑️', '.unowner', '@utente')}
${L('📜', '.log', '[n]')}
${L('📦', '.aggiorna')}
${L('🧹', '.clear')}
${L('📋', '.infobot')}
${L('📊', '.status')}
${L('📦', '.groups')}`;
        }

        const SP = db._config?.sponsorLink || 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo?s=cl&p=a&ilr=0';
        menuTxt +=
`├── 🌟 ${BF('SPONSOR')} ───────────┤
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
