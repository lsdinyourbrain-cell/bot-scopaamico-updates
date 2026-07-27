'use strict';

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Esegue il comando .menu.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            let pfpUrl;
            try { pfpUrl = await sock.profilePictureUrl(from, 'image'); } catch (_) { pfpUrl = null; }

            let antilinkSection;
            if (isGroup) {
                const alCfg = getAntilinkGroup(from);
                const keys = Object.keys(ANTILINK_PLATFORMS);
                const alLines = keys.map(p => `┃  ${alCfg[p] ? '🟢' : '🔴'} .antilink ${p} on/off`).join('\n');
                antilinkSection =
`┠══════════════════════════════════════╣
┃ 🔗 *ANTILINK* (Owner)
${alLines}
┃
┃  🢒 .antilink tutti on/off`;
            } else {
                antilinkSection =
`▣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 🔗 ANTILINK
┃  🢒 Solo nei gruppi.`;
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });

            let menuTxt =
`╔══════════════════════════════════════╗
║   ✨ *SCOPAAMICO BOT* v9.0 ✨
║   👤 ${pushName.slice(0, 18)}  🕐 ${timeStr} ${dateStr}
╠══════════════════════════════════════╣
║ 🆕 *NOVITÀ v9.0* 🆕
║  🢒 ⚔️ .duello
║  🢒 🎟️ .lotteria
║  🢒 👤 .profilo
║  🢒 🏁 .bandiera
║  🢒 ❓ .quiz
║  🢒 💞 .compatibilita
║  🢒 🦹 .ruba
║  🢒 🏧 .deposita / 💳 .preleva
║  🢒 📅 .daily
║  🢒 🚫 .mute @u [durata]
║  🢒 🎁 .dona @u [€]
║  🢒 🔇 anti-flood + 🤬 bestemmiometro + 💰 taglie
╠══════════════════════════════════════╣
║ 💝 *FAMIGLIA*
║  🢒 .famiglia [sposa/adotta/caccia/divorzia/abbandona]
╠══════════════════════════════════════╣
║ 🪙 *ECONOMIA*
║  🢒 💰 .cassaforte
║  🢒 ⛏️ .scava
║  🢒 🎰 .casino [€]
║  🢒 🎲 .dadi [€]
║  🢒 🎰 .slot
║  🢒 🔴 .roulette [€]
║  🢒 🪨 .sasso / 📄 .carta / ✂️ .forbici
║  🢒 📅 .daily
║  🢒 🏧 .deposita [€]
║  🢒 💳 .preleva [€]
║  🢒 🦹 .ruba @utente
║  🢒 ⚔️ .colpisci
║  🢒 🎟️ .lotteria (50€)
║  🢒 🏆 .top
║  🢒 🤑 .ricchi
╠══════════════════════════════════════╣
║ 🎲 *SOCIAL*
║  🢒 💞 .ship
║  🢒 🏳️‍🌈 .gay
║  🢒 💖 .simpatometro
║  🢒 📊 .percentuale
║  🢒 🤔 .scelta
║  🢒 🌸 .fiore
║  🢒 🦸 .personaggio
║  🢒 📺 .anime
║  🢒 🖥️ .assemblapc
║  🢒 🤫 .verita
║  🢒 🫣 .obbligo
║  🢒 🔮 .oroscopo
║  🢒 🐺 .maranza
╠══════════════════════════════════════╣
║ 🔥 *INTERAZIONI*
║  🢒 🖐️ .schiaffo
║  🢒 😘 .bacia
║  🢒 🫂 .abbraccia
║  🢒 💍 .sposa
║  🢒 🍑 .paccasulculo
║  🢒 🔪 .uccidi
║  🢒 🤬 .insulta
║  🢒 🔞 .scopa
║  🢒 💦 .sborra
║  🢒 👉👌 .ditalino
║  🢒 🍆 .sega
║  🢒 🤰 .incinta
║  🢒 🍒 .tette
║  🢒 😂 .meme
║  🢒 🥊 .rissa
║  🢒 🍆 .cazzo
║  🢒 🤪 .sclero
║  🢒 🍹 .drink
║  🢒 🙏 .scusa
║  🢒 🪵 .palo
║  🢒 🗣️ .gossip
╠══════════════════════════════════════╣
║ 🛠️ *UTILITY*
║  🢒 👤 .profilo
║  🢒 👑 .admin
║  🢒 📡 .ping
║  🢒 ℹ️ .groupinfo
║  🢒 🌤️ .weather [città]
║  🢒 🎨 .sticker / .s
║  🢒 📹 .vv
║  🢒 💻 .hack
║  🢒 👥 .clona
║  🢒 🔊 .tts [testo]
║  🢒 🐿️ .chipmunk
║  🢒 🏃 .rubato
║  🢒 🎵 .lyrics
╠══════════════════════════════════════╣
║ 🎤 *AUDIO*
║  🢒 🎙️ .deep
║  🢒 🔄 .reverse
║  🢒 🗣️ .echo
║  🢒 🤖 .robot
║  🢒 🥴 .drunk
║  🢒 🔊 .bass
║  🢒 🌙 .nightcore
║  🢒 🔮 .8d
╠══════════════════════════════════════╣
║ 📥 *MEDIA*
║  🢒 📸 .ig
║  🢒 💀 .wasted
║  🢒 📖 .pokedex
║  🢒 🤡 .clown
╠══════════════════════════════════════╣
║ 🤖 *AI*
║  🢒 🧠 .ai [domanda]
╠══════════════════════════════════════╣
║ 🎮 *GIOCHI*
║  🢒 ❓ .quiz
║  🢒 🏁 .bandiera
║  🢒 💞 .compatibilita @utente
║  🢒 ⚔️ .duello @u [puntata]
╠══════════════════════════════════════╣
║ ⚙️ *ADMIN*
║  🢒 📢 .tag
║  🢒 📣 .tagall
║  🢒 🔒 .chiudi / 🔓 .apri
║  🢒 🚫 .ban
║  🢒 🔗 .link
║  🢒 🗑️ .del
║  🢒 🔇 .mute / 🔊 .unmute
║  🢒 ⚠️ .warn / ✅ .unwarn
║  🢒 👑 .promote / .demote (.p / .d)
║  🢒 ✅ .accettarichieste
║  🢒 🗣️ .say [testo]
║  🢒 🔗 .invito
║  🢒 ⏸️ .pausa / ▶️ .riprendi
${antilinkSection}`;

            if (isOwner) {
                menuTxt +=
`┠══════════════════════════════════════╣
┃ 🛡 *OWNER*
┃  🢒 ⏻ .spegni
┃  🢒 ⏼ .accendi
┃  🢒 🔄 .riavvia
┃  🢒 👋 .welcome on/off
┃  🢒 👋 .goodbye on/off`;
            }

            const SP = 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo';
            menuTxt +=
`┃
╠══════════════════════════════════════╣
║   🌟 *SPONSOR* 🌟                  ║
║  Entra nel gruppo ufficiale! 🫶    ║
║  ${SP}
╚══════════════════════════════════════╝`;

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
