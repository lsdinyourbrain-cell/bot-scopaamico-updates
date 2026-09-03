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

            const portLines = linee.length ? linee.map(l => line(l)).join('\n') : `${line('📭 Portafoglio vuoto.')}\n${line('💎 Compra con: _*.investi compra GOOG*_ ✨')}`;
            const text = `${sec('💹 BORSA GLASS')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — *PORTAFOGLIO* ✨🔮`)}\n${line('')}\n${portLines}\n${line('')}\n${line(`💶 Valore azioni: _${tot}€_ • 💎 vetro cromato`)}\n${line(`💳 Contante: _${uDB.money}€_`)}\n${boxEnd()}`;
            return await sendButtons(sock, from, text, [
                { label: '📝 Listino ✨', id: 'investi listino' },
            ], msg);
        }

        if (azione === 'LISTINO') {
            const listino = `${sec('📊 LISTINO GLASS')}\n${boxOpen()}\n${line(`💎 Mercato *VEX* — prezzi in vetro 💫`)}\n${line('')}\n${AZIENDE.map(a => line(`🔹 ${a.code.padEnd(6)} ${a.name.padEnd(12)} _${a.price}€_ 💎`)).join('\n')}\n${line('')}\n${line('📌 *.investi compra <CODICE> [n]* ✨')}\n${boxEnd()}`;
            return await sendButtons(sock, from, listino, [
                { label: '📊 Portafoglio 💎', id: 'investi' },
            ], msg);
        }

        if (azione === 'COMPRA' || azione === 'VENDI') {
            const target = (parts[1] || '').toUpperCase();
            const azienda = AZIENDE.find(a => a.code === target);
            if (!azienda) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line(`Azione *${target}* non trovata.`)}\n${line('Usa *.investi listino*.')}\n${boxEnd()}`);

            if (azione === 'COMPRA') {
                const qty = Math.floor(parseInt(parts[2], 10));
                if (parts[2] !== undefined && (isNaN(qty) || qty < 1)) return reply(`${sec('❌ ERRORE')}\n${boxOpen()}\n${line('💎 Quantità non valida ✨')}\n${boxEnd()}`);
                const n = (isNaN(qty) || qty < 1) ? 1 : qty;
                const costo = azienda.price * n;
                if (uDB.money < costo) return reply(`${sec('💸 FONDI INSUFFICIENTI')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — servono _${costo}€_ 💫`)}\n${line(`💳 Hai _${uDB.money}€_ • ricarica con *.daily* ✨`)}\n${boxEnd()}`);
                uDB.money -= costo;
                uDB.azioni[target.toUpperCase()] = (uDB.azioni[target.toUpperCase()] || 0) + n;
                saveDB();
                return sock.sendMessage(from, { text: `${sec('✅ AZIONI COMPRATE')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — *ACQUISTO* 📈✨`)}\n${line(`🏢 _${azienda.name}_ (${target})`)}\n${line(`📈 Quantità: _${n}_ • 💰 Costo: _${costo}€_`)}\n${line(`💳 Saldo: _${uDB.money}€_ • 🔮 vetro confermato`)}\n${boxEnd()}`, mentions: [sender] }, { quoted: msg });
            }

            const q = Math.floor(parseInt(parts[2], 10));
            if (parts[2] !== undefined && (isNaN(q) || q < 1)) return reply(`${sec('❌ ERRORE')}\n${boxOpen()}\n${line('💎 Quantità non valida ✨')}\n${boxEnd()}`);
            const qty2 = (isNaN(q) || q < 1) ? (uDB.azioni[target.toUpperCase()] || 1) : q;
            if (qty2 <= 0 || (uDB.azioni[target.toUpperCase()] || 0) < 1) return reply(`${sec('📭 NESSUN POSSESSO')}\n${boxOpen()}\n${line(`💎 Non possiedi azioni di *${azienda.name}* ✨`)}\n${boxEnd()}`);
            if (qty2 > uDB.azioni[target.toUpperCase()]) return reply(`${sec('❌ ERRORE')}\n${boxOpen()}\n${line(`💎 Ne possiedi solo _${uDB.azioni[target.toUpperCase()]}_ ✨`)}\n${boxEnd()}`);
            const ricavo = azienda.price * qty2;
            uDB.azioni[target.toUpperCase()] -= qty2;
            if (uDB.azioni[target.toUpperCase()] <= 0) delete uDB.azioni[target.toUpperCase()];
            uDB.money += ricavo;
            saveDB();
            return sock.sendMessage(from, { text: `${sec('💸 AZIONI VENDUTE')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — *VENDITA* 📉✨`)}\n${line(`🏢 _${azienda.name}_ (${target})`)}\n${line(`📉 Quantità: _${qty2}_ • 💵 Ricavo: _${ricavo}€_`)}\n${line(`💳 Saldo: _${uDB.money}€_ • 🔮 profitto vetro`)}\n${boxEnd()}`, mentions: [sender] }, { quoted: msg });
        }

        return reply(`${sec('💹 USO INVESTI GLASS')}\n${boxOpen()}\n${line(`💎 *.investi* — portafoglio ✨`)}\n${line(`📊 *.investi listino* — prezzi vetro`)}\n${line(`📈 *.investi compra <codice> [n]* 🔮`)}\n${line(`📉 *.investi vendi <codice> [n]* 💫`)}\n${boxEnd()}`);
    },
};
