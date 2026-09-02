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
                return prog.done(`${sec('CRYPTO')}\n${boxOpen()}\n${line('⚠️ Criptovaluta non trovata.')}\n${line('Prova con nomi come: bitcoin, ethereum, dogecoin, solana, cardano.')}\n${boxEnd()}`);
            }
            const c = data[0];
            const price = c.current_price?.toLocaleString('it-IT', { maximumFractionDigits: 2 }) || '?';
            const chg = c.price_change_percentage_24h;
            const arrow = chg >= 0 ? '📈' : '📉';
            const txt = `${sec(c.name.toUpperCase())}\n${boxOpen()}\n${line(`_${c.symbol?.toUpperCase() || '?'}_` )}\n${line('')}\n${line(`💰 Prezzo: _$${price}_`)}\n${line(`${arrow} 24h: _${chg?.toFixed(2) || '?'}%_`)}\n${line(`🏆 Posizione: _#${c.market_cap_rank ?? '?'}_` )}\n${boxEnd()}`;
            await prog.done(txt);
        } catch (_) {
            await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('⚠️ Errore nel recupero dei prezzi. Riprova più tardi.')}\n${boxEnd()}`);
        }
    },
};
