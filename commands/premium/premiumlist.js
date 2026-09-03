'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');
const { dispOf } = require('../../lib/jid');

module.exports = {
    name: 'premiumlist',
    aliases: ['listpremium', 'viplist', 'listavip'],
    description: 'Lista utenti Premium/VIP con grafica glass.',

    async run(sock, msg, args, context) {
        const { from, sender, services } = context;
        const { db } = services;
        const list = prem.listPremium(db);
        if (!list.length) {
            const txt = `${sec('💎 PREMIUM LIST')}\n${boxOpen()}\n${line('✨ Nessun utente *Premium* al momento 💎')}\n${line('')}\n${line('👑 Sii il primo a brillare!')}\n${line('💫 Contatta un Owner per attivarlo 🔮')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: txt }, { quoted: msg });
        }

        list.sort((a,b)=> (a.expiry||Infinity)-(b.expiry||Infinity));
        const mentions = [];
        const rows = list.slice(0, 20).map((p,i)=>{
            const rank = i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`;
            const jid = p.jid;
            const tag = dispOf(jid);
            if (jid.includes('@')) mentions.push(jid);
            const remain = prem.formatRemaining(p.expiry);
            return line(`${rank} @${tag} • _${remain}_ 💎`);
        }).join('\n');

        const extra = list.length > 20 ? line(`...e altri _${list.length-20}_ ✨`) : '';
        const txt = `${sec('💎 PREMIUM LIST')}\n${boxOpen()}\n${line(`👑 _${list.length}_ utenti VIP • vetro diamantato ✨`)}\n${line('')}\n${rows}\n${extra ? extra+'\n' : ''}${line('')}\n${line(`🔮 Usa *.premium* per info • *.vip* per tier`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions }, { quoted: msg });
    },
};
