'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'crypto',
    aliases: ['cripto', 'bitcoin'],
    description: "Mostra il prezzo delle principali criptovalute (CoinGecko, gratis). Uso: .crypto <nome> (es. .crypto bitcoin, ethereum, dogecoin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios, showProgress } = services;

        const symbol = String(textArgs || 'bitcoin').trim().toLowerCase().replace(/\s+/g, '-');

        try {
            const prog = await showProgress(sock, from, { label: 'CRIPTOVALUTE', duration: 3000, quoted: msg });
            const { data } = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
                params: { vs_currency: 'usd', ids: symbol, order: 'market_cap_desc', per_page: 1, page: 1, sparkline: false },
                timeout: 10000,
            });
            if (!Array.isArray(data) || !data.length) {
                return prog.done('⚠️ _Criptovaluta non trovata._ Prova con nomi come: bitcoin, ethereum, dogecoin, solana, cardano.');
            }
            const c = data[0];
            const price = c.current_price?.toLocaleString('it-IT', { maximumFractionDigits: 2 }) || '?';
            const chg = c.price_change_percentage_24h;
            const arrow = chg >= 0 ? '📈' : '📉';
            const txt = `🪙 *_${c.name}_* (_${c.symbol?.toUpperCase() || '?'}_)\n\n▸ 💰 *Prezzo:* _$${price}_\n▸ ${arrow} *24h:* _${chg?.toFixed(2) || '?'}%_\n▸ 🏆 *Posizione:* _#${c.market_cap_rank ?? '?'}_\n\n`;
            await prog.done(txt);
        } catch (_) {
            await reply('⚠️ _Errore nel recupero dei prezzi. Riprova più tardi._');
        }
    },
};