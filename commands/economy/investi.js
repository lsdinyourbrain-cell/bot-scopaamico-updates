'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'investi',
    aliases: ['borsa', 'azioni'],
    description: "Compra e vendi azioni in borsa: i prezzi variano. `.investi` portafoglio, `.investi listino`, `.investi compra <CODE> [n]`, `.investi vendi <CODE> [n]`.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { db, getUser, saveDB, sendButtons, randomInt } = services;

        const AZIENDE = [
            { code: 'WA',   name: 'WhatsApp Inc', price: 250 },
            { code: 'GOOG', name: 'Google',       price: 340 },
            { code: 'MCRS', name: 'Microsoft',    price: 290 },
            { code: 'AMP',  name: 'Amazon',       price: 410 },
            { code: 'NOD',  name: 'NodeJS',       price: 180 },
            { code: 'TC',   name: 'Tesla',        price: 520 },
            { code: 'MT',   name: 'Meta',         price: 230 },
            { code: 'APL',  name: 'Apple',        price: 300 },
        ];

        const uDB = getUser(sender, from);
        if (!uDB.azioni) uDB.azioni = {};

        if (!db.market) db.market = { tick: 0 };
        db.market.tick = (db.market.tick || 0) + 1;
        if (db.market.tick % 3 === 1) {
            for (const a of AZIENDE) {
                const delta = randomInt(-10, 10);
                a.price = Math.max(20, Math.round(a.price * (1 + delta / 100)));
            }
            saveDB();
        }

        const parts = (textArgs || '').trim().split(/\s+/);
        const azione = (parts[0] || '').toUpperCase();

        if (!azione || azione === 'PORTAFOGLIO' || azione === 'MIO') {
            const linee = Object.entries(uDB.azioni)
                .map(([code, qty]) => {
                    const a = AZIENDE.find(x => x.code === code.toUpperCase());
                    if (!a) return null;
                    const valore = a.price * qty;
                    return `${code.padEnd(5)} x${qty} @ ${a.price}€ = ${valore}€`;
                })
                .filter(Boolean);
            const tot = linee.length
                ? Object.entries(uDB.azioni).reduce((s, [c, q]) => {
                    const a = AZIENDE.find(x => x.code === c.toUpperCase());
                    return s + (a ? a.price * q : 0);
                }, 0)
                : 0;

            const text =
`📈 *_BORSA_*
▸ ${linee.length ? linee.join('\n') : '📭 Portafoglio vuoto.\n▸ Compra azioni con: _*.investi compra GOOG*_'}
▸ 💶 Valore azioni: _${tot}€_
▸ 💳 Contante: _${uDB.money}€_
`;
            return await sendButtons(sock, from, text, [
                { label: '📝 Listino', id: 'investi listino' },
            ], msg);
        }

        if (azione === 'LISTINO') {
            const listino =
`📝 *_LISTINO AZIONI_*
▸ ${AZIENDE.map(a => `${a.code.padEnd(6)} ${a.name.padEnd(12)} ${a.price}€`).join('\n')}
▸ _*.investi compra <CODICE> [n]*_
`;
            return await sendButtons(sock, from, listino, [
                { label: '📊 Il tuo portafoglio', id: 'investi' },
            ], msg);
        }

        if (azione === 'COMPRA' || azione === 'VENDI') {
            const target = (parts[1] || '').toUpperCase();
            const azienda = AZIENDE.find(a => a.code === target);
            if (!azienda) return reply(`❌ Azione *${target}* non trovata.\nUsa *.investi listino*.`);

            if (azione === 'COMPRA') {
                const qty = Math.floor(parseInt(parts[2], 10));
                if (parts[2] !== undefined && (isNaN(qty) || qty < 1)) return reply(`❌ Quantità non valida.`);
                const n = (isNaN(qty) || qty < 1) ? 1 : qty;
                const costo = azienda.price * n;
                if (uDB.money < costo) return reply(`❌ Non ti bastano i soldi.\nServono *${costo}€*.`);
                uDB.money -= costo;
                uDB.azioni[target.toUpperCase()] = (uDB.azioni[target.toUpperCase()] || 0) + n;
                saveDB();
                return reply(`✅ *_COMPRATE!_*\n\n▸ 📈 Azioni: _${n}_\n▸ 🏢 _${azienda.name}_\n▸ 💰 Costo: _${costo}€_\n\n▸ 💳 Saldo: _${uDB.money}€_\n`);
            }

            const q = Math.floor(parseInt(parts[2], 10));
            if (parts[2] !== undefined && (isNaN(q) || q < 1)) return reply(`❌ Quantità non valida.`);
            const qty2 = (isNaN(q) || q < 1) ? (uDB.azioni[target.toUpperCase()] || 1) : q;
            if (qty2 <= 0 || (uDB.azioni[target.toUpperCase()] || 0) < 1) return reply(`❌ Non possiedi azioni\ndi *${azienda.name}*.`);
            if (qty2 > uDB.azioni[target.toUpperCase()]) return reply(`Ne possiedi solo *${uDB.azioni[target.toUpperCase()]}*.`);
            const ricavo = azienda.price * qty2;
            uDB.azioni[target.toUpperCase()] -= qty2;
            if (uDB.azioni[target.toUpperCase()] <= 0) delete uDB.azioni[target.toUpperCase()];
            uDB.money += ricavo;
            saveDB();
            return reply(`💰 *_VENDUTE!_*\n\n▸ 📉 Azioni: _${qty2}_\n▸ 🏢 _${azienda.name}_\n▸ 💵 Ricavo: _${ricavo}€_\n\n▸ 💳 Saldo: _${uDB.money}€_\n`);
        }

        reply("⚠️ _[uso]:_\n▸ _*.investi*_ — portafoglio\n▸ _*.investi listino*_ — prezzi\n▸ _*.investi compra <codice> [n]*_\n▸ _*.investi vendi <codice> [n]*_");
    },
};