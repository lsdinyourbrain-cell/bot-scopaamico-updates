'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'weather',
    aliases: [],
    description: "Esegue il comando .weather.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons, showProgress } = services;


            if (!textArgs) return sendButtons(sock, from,
                `${sec('🌤️ METEO GLASS')}\n${boxOpen()}\n${line('💎 Scrivi una città nel vetro ✨🔮')}\n${line('📌 Esempio: *.weather Milano* 💫')}\n${boxEnd()}`,
                [{ label: '🌤️ Roma ✨', id: 'weather Roma' }],
                msg);
            try {
                const prog = await showProgress(sock, from, { label: 'METEO', duration: 3000, quoted: msg });
                const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(textArgs)}?format=j1`, { timeout: 10_000 });
                const current = data.current_condition?.[0];
                const area = data.nearest_area?.[0];
                if (!current) throw new Error('Dati meteo non disponibili');
                const city = area?.areaName?.[0]?.value || textArgs;
                const description = current.weatherDesc?.[0]?.value || 'N/D';
                await prog.done(`${sec('🌤️ METEO GLASS')}\n${boxOpen()}\n${line(`💎 📍 *${city}* ✨🔮`)}\n${line(`🌡️ _${current.temp_C}°C_ • _${description}_ 💫`)}\n${line(`💧 Umidità: _${current.humidity}%_ • 🌬️ Vento: _${current.windspeedKmph} km/h_ 💎`)}\n${boxEnd()}`);
            } catch (_) {
                await reply(`${sec('❌ METEO ERRORE')}\n${boxOpen()}\n${line('💎 Città non trovata nel vetro ✨')}\n${line('🔮 _Prova nome più preciso_ 💫')}\n${boxEnd()}`);
            }
    },
};
