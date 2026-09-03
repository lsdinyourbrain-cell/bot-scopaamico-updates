'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

const ITEMS = [
    { id:'diamante', emoji:'💎', name:'Diamante VEX', price:180, desc:'Gemma ultra rara, rivendibile a 220€' },
    { id:'crown', emoji:'👑', name:'Corona Elite', price:250, desc:'+150 XP e titolo Corona dorata' },
    { id:'crystal', emoji:'🔮', name:'Cristallo Glass', price:120, desc:'Boost +90€ istantanei' },
    { id:'rocket', emoji:'🚀', name:'Turbo Razzo', price:200, desc:'Annulla cooldown boost' },
];

module.exports = {
    name: 'premiumshop',
    aliases: ['shoppremium', 'pshop', 'vipshop'],
    description: 'Shop esclusivo Premium con oggetti leggendari.',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, services } = context;
        const { db, getUser, saveDB, sendButtons } = services;

        if (!prem.isPremium(db, sender) && !isOwner) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }

        const u = getUser(sender, from);
        if (!u.shopInv) u.shopInv = {};
        const t = String(args[0]||'').toLowerCase();

        if (t === 'compra' || t === 'buy') {
            const id = String(args[1]||'').toLowerCase();
            const it = ITEMS.find(x=> x.id===id);
            if (!it) {
                const txt = `${sec('💎 PREMIUM SHOP')}\n${boxOpen()}\n${line('❓ Oggetto non trovato')}\n${line(`📦 Disponibili: _${ITEMS.map(i=>i.id).join(', ')}_` )}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: txt }, { quoted: msg });
            }
            if (u.money < it.price) {
                const txt = `${sec('💎 PREMIUM SHOP')}\n${boxOpen()}\n${line(`💸 Servono _${it.price}€_ — hai _${u.money}€_ 💎`)}\n${line('💫 Usa *.premiumdaily* per fare cassa!')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
            }
            u.money -= it.price;
            u.shopInv[it.id] = (u.shopInv[it.id]||0)+1;
            if (it.id==='crystal') u.money += 90;
            if (it.id==='crown') { u.xp=(u.xp||0)+150; if(!u.pregi) u.pregi=[]; u.pregi.push({rank:'👑 Corona Elite', lv:0, ts:Date.now()}); }
            if (it.id==='rocket' && u.cooldowns) delete u.cooldowns.boost;
            saveDB();
            const txt = `${sec('✅ ACQUISTO PREMIUM')}\n${boxOpen()}\n${line(`${it.emoji} *${it.name}* acquistato! ✨`)}\n${line(`💰 -${it.price}€ • Saldo: _${u.money}€_`)}\n${line(`🎒 Zaino: _${it.id}_ x${u.shopInv[it.id]}`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
        }

        const list = ITEMS.map(it=> line(`${it.emoji} *${it.name}* — _${it.price}€_ • ${it.desc}`)).join('\n');
        const txt = `${sec('💎 PREMIUM SHOP')}\n${boxOpen()}\n${line(`✨ Esclusiva *VETRO DIAMANTATO* per @${sender.split('@')[0]} 🔮`)}\n${line(`💰 Saldo: _${u.money}€_`)}\n${line('')}\n${list}\n${line('')}\n${line('📌 Compra: *.premiumshop compra <id>*')}\n${line(`📦 IDs: _${ITEMS.map(i=>i.id).join(', ')}_`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
    },
};
