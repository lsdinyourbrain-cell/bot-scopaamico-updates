'use strict';

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
                    return `│ ${code.toUpperCase().padEnd(5)} x${qty}  @ ${a.price}€  = ${valore}€`;
                })
                .filter(Boolean);
            const tot = linee.length
                ? Object.entries(uDB.azioni).reduce((s, [c, q]) => {
                    const a = AZIENDE.find(x => x.code === c.toUpperCase());
                    return s + (a ? a.price * q : 0);
                }, 0)
                : 0;

            const text =
`╔══════════════════════════════╗
║        📈 *BORSA* 📈
╠══════════════════════════════╣
${linee.length ? linee.join('\n') : '│  📭 Portafoglio vuoto.\n│  Compra azioni con:\n│  *.investi compra GOOG*'}
╠══════════════════════════════╣
║  💶 Valore azioni: *${tot}€*
║  💳 Contante: *${uDB.money}€*
╚══════════════════════════════╝`;
            return await sendButtons(sock, from, text, [
                { label: '📝 Listino', id: 'investi listino' },
            ], msg);
        }

        if (azione === 'LISTINO') {
            const listino =
`╔══════════════════════════════╗
║     📝 *LISTINO AZIONI*      ║
╠══════════════════════════════╣
${AZIENDE.map(a => `│  ${a.code.padEnd(6)} ${a.name.padEnd(12)} ${a.price}€`).join('\n')}
╠══════════════════════════════╣
║  *.investi compra <CODICE> [n]*
╚══════════════════════════════╝`;
            return await sendButtons(sock, from, listino, [
                { label: '📊 Il tuo portafoglio', id: 'investi' },
            ], msg);
        }

        if (azione === 'COMPRA' || azione === 'VENDI') {
            const target = (parts[1] || '').toUpperCase();
            const azienda = AZIENDE.find(a => a.code === target);
            if (!azienda) return reply(`❌ Azione *${target}* non trovata. Usa *.investi listino*.`);

            if (azione === 'COMPRA') {
                const qty = parseInt(parts[2]) || 1;
                const costo = azienda.price * qty;
                if (uDB.money < costo) return reply(`❌ Non ti bastano i soldi: servono *${costo}€*.`);
                uDB.money -= costo;
                uDB.azioni[target.toUpperCase()] = (uDB.azioni[target.toUpperCase()] || 0) + qty;
                saveDB();
                return reply(`✅ Comprate *${qty}* azioni di *${azienda.name}* per *${costo}€*.\n💰 Saldo: *${uDB.money}€*.`);
            }

            const q = parseInt(parts[2]) || (uDB.azioni[target.toUpperCase()] || 1);
            if (q <= 0 || (uDB.azioni[target.toUpperCase()] || 0) < 1) return reply(`❌ Non possiedi azioni di *${azienda.name}*.`);
            if (q > uDB.azioni[target.toUpperCase()]) return reply(`Ne possiedi solo *${uDB.azioni[target.toUpperCase()]}*.`);
            const ricavo = azienda.price * q;
            uDB.azioni[target.toUpperCase()] -= q;
            if (uDB.azioni[target.toUpperCase()] <= 0) delete uDB.azioni[target.toUpperCase()];
            uDB.money += ricavo;
            saveDB();
            return reply(`💰 Vendute *${q}* azioni di *${azienda.name}* per *${ricavo}€*.\n💳 Saldo: *${uDB.money}€*.`);
        }

        reply("⚠️ Uso:\n• *.investi* — il tuo portafoglio\n• *.investi listino* — prezzi azioni\n• *.investi compra <codice> [n]*\n• *.investi vendi <codice> [n]*");
    },
};