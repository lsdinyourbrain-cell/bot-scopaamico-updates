'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

module.exports = {
    name: 'diamond',
    aliases: ['diamante', 'diamantestatus'],
    description: 'Stato Diamond premium con effetti glass.',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, services } = context;
        const { db, getUser } = services;
        if (!prem.isPremium(db, sender) && !isOwner) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }
        const u = getUser(sender, from);
        const info = prem.getPremiumInfo(db, sender);
        const remain = info ? prem.formatRemaining(info.expiry) : '∞ Owner';
        const txt = `${sec('💎 DIAMOND TIER')}\n${boxOpen()}\n${line(`✨ @${dispOf(sender)} — *DIAMOND* 💎🔮`)}\n${line(`🌟 _Il vetro più puro di VEX_`)}\n${line('')}\n${line(`💰 Saldo: _${u.money||0}€_`)}\n${line(`⭐ XP: _${u.xp||0}_ • Lv _${u.level||1}_`)}\n${line(`⏳ Scadenza: _${remain}_`)}\n${line('')}\n${line(`💫 Poteri Diamond:`)}\n${line(`  ▸ 💎 Cashback 10% su shop`)}\n${line(`  ▸ 🔮 Sconto premiumShop -15%`)}\n${line(`  ▸ 🚀 2 boost/giorno extra`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
    },
};
