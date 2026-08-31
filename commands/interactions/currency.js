'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'currency',
    aliases: ['cambio'],
    description: "Converte tra valute. Uso: .currency 100 EUR USD (valute in formato ISO, es. EUR, USD, GBP, JPY).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios, showProgress } = services;

        const parts = String(textArgs || '').trim().split(/\s+/);
        const amount = parseFloat(parts[0]);
        const fromC = (parts[1] || 'EUR').toUpperCase();
        const toC = (parts[2] || 'USD').toUpperCase();

        if (!amount || isNaN(amount)) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: \\`.currency <importo> <da> <a>\\`_ ▸ _Es: \\`.currency 100 EUR USD\\`')}
${boxEnd()}`);
        }

        try {
            const prog = await showProgress(sock, from, { label: 'CAMBIO VALUTA', duration: 3000, quoted: msg });
            const { data } = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromC}`, { timeout: 10000 });
            const rate = data?.rates?.[toC];
            if (!rate) return prog.done(`⚠️ _Valuta "${toC}" non trovata._ Codici ISO validi: EUR, USD, GBP, JPY, CHF...`);
            const converted = (amount * rate).toLocaleString('it-IT', { maximumFractionDigits: 2 });
            const formatted = amount.toLocaleString('it-IT', { maximumFractionDigits: 2 });
            await prog.done(`💱 *_CAMBIO VALUTA_*\n\n▸ _${formatted} ${fromC}_ = _*${converted} ${toC}*_\n▸ 📊 *Tasso:* _1 ${fromC} = ${rate.toFixed(4)} ${toC}_\n\n`);
        } catch (_) {
            await reply('⚠️ _Errore nel cambio valuta. Riprova più tardi._');
        }
    },
};