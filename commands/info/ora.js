'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'ora',
    aliases: ["time", "orario", "clock"],
    description: "Mostra l'ora attuale di una città o fuso europeo. Uso: .ora <città> (es. .ora Rome, .ora New York).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios, sendButtons, showProgress } = services;

        const city = String(textArgs || '').trim() || 'Rome';

        try {
            const prog = await showProgress(sock, from, { label: 'ORARIO', duration: 3000, quoted: msg });
            const { data } = await axios.get(`https://worldtimeapi.org/api/time/Europe/${encodeURIComponent(city)}`, { timeout: 9000 });
            if (data?.datetime) {
                const dt = new Date(data.datetime);
                const time = dt.toLocaleTimeString('it-IT');
                const date = dt.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
                const tz = data.utc_offset || '?';
                await prog.done(`🕐 *_Ora a ${city}_*\n━━━━━━━━━━━━━━━━━━\n▸ ⏰ _${time}_\n▸ 📅 _${date}_\n▸ 🌍 Timezone: _UTC${tz}_\n━━━━━━━━━━━━━━━━━━\n`);
                return;
            }
        } catch (_) {}

        try {
            const now = new Date();
            const time = now.toLocaleTimeString('it-IT');
            const date = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
            await sendButtons(sock, from, `🕐 *_Ora di sistema_*\n━━━━━━━━━━━━━━━━━━\n▸ ⏰ _${time}_\n▸ 📅 _${date}_\n━━━━━━━━━━━━━━━━━━\nℹ️ Città "${city}" non trovata; mostro l'ora del server.\n`, [
                { label: '.ora', id: 'ora' },
            ], msg);
        } catch (_) {
            await reply('❌ Errore nel recupero dell\'ora. Riprova.');
        }
    },
};