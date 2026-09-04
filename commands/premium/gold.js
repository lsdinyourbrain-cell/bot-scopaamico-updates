'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

module.exports = {
    name: 'gold',
    aliases: ['oro', 'goldstatus'],
    description: 'Tier Gold premium con grafica dorata glass.',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, services } = context;
        const { db, getUser } = services;
        if (!prem.isPremium(db, sender) && !isOwner) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }
        const u = getUser(sender, from);
        const remain = prem.getPremiumInfo(db, sender) ? prem.formatRemaining(prem.getPremiumInfo(db, sender).expiry) : '∞ Owner';
        const txt = `${sec('🥇 GOLD TIER')}\n${boxOpen()}\n${line(`✨ @${dispOf(sender)} — *GOLD* 🥇💫`)}\n${line(`💛 _Lusso dorato, vetro cromato_`)}\n${line('')}\n${line(`💰 Saldo: _${u.money||0}€_`)}\n${line(`🏦 Banca: _${u.bank||0}€_`)}\n${line(`⏳ Scadenza: _${remain}_`)}\n${line('')}\n${line(`🌟 Vantaggi Gold:`)}\n${line(`  ▸ 🥇 +5% vincite giochi`)}\n${line(`  ▸ 💫 Accesso gold vault`)}\n${line(`  ▸ ✨ Badge oro nel profilo`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
    },
};
