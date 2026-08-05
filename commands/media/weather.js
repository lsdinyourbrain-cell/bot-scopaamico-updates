'use strict';

module.exports = {
    name: 'weather',
    aliases: [],
    description: "Esegue il comando .weather.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            if (!textArgs) return sendButtons(sock, from,
                "🌤️ *Manca la città!*\n\nEsempio: `.weather Milano`",
                [{ label: '🌤️ .weather Roma', id: 'weather Roma' }],
                msg);
            try {
                const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(textArgs)}?format=j1`, { timeout: 10_000 });
                const current = data.current_condition?.[0];
                const area = data.nearest_area?.[0];
                if (!current) throw new Error('Dati meteo non disponibili');
                const city = area?.areaName?.[0]?.value || textArgs;
                const description = current.weatherDesc?.[0]?.value || 'N/D';
                await reply(
`╭────〔 🌦️ *METEO* 〕────╮
│ 📍 *${city}*
│ 🌡️ ${current.temp_C}°C — ${description}
│ 💧 Umidità: ${current.humidity}%
│ 🌬️ Vento: ${current.windspeedKmph} km/h
╰─────────────────────────╯`);
            } catch (_) {
                await reply("Non trovo il meteo di questa città. Riprova con un nome più preciso.");
            }
    },
};
