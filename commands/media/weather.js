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
                `${sec('METEO')}\n${boxOpen()}\n${line('⚠️ Uso: scrivi una città.')}\n${line('Esempio: *.weather Milano*')}\n${boxEnd()}`,
                [{ label: '.weather Roma', id: 'weather Roma' }],
                msg);
            try {
                const prog = await showProgress(sock, from, { label: 'METEO', duration: 3000, quoted: msg });
                const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(textArgs)}?format=j1`, { timeout: 10_000 });
                const current = data.current_condition?.[0];
                const area = data.nearest_area?.[0];
                if (!current) throw new Error('Dati meteo non disponibili');
                const city = area?.areaName?.[0]?.value || textArgs;
                const description = current.weatherDesc?.[0]?.value || 'N/D';
                await prog.done(`${sec('METEO')}\n${boxOpen()}\n${line(`📍 *${city}*`)}\n${line(`🌡️ _${current.temp_C}°C_` )}\n${line(`_${description}_`)}\n${line(`💧 Umidità: ${current.humidity}%`)}\n${line(`🌬️ Vento: ${current.windspeedKmph} km/h`)}\n${boxEnd()}`);
            } catch (_) {
                await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('❌ Non trovo il meteo di questa città. Riprova con un nome più preciso.')}\n${boxEnd()}`);
            }
    },
};
