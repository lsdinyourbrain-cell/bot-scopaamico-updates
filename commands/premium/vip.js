'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

module.exports = {
    name: 'vip',
    aliases: ['vipstatus', 'vipinfo'],
    description: 'Mostra lo stato VIP con grafica glass premium.',

    async run(sock, msg, args, context) {
        const { from, sender, pushName, isOwner, services } = context;
        const { db } = services;
        const info = prem.getPremiumInfo(db, sender);
        const isVip = prem.isPremium(db, sender) || isOwner;
        const total = prem.listPremium(db).length;

        if (isVip) {
            const remain = info ? prem.formatRemaining(info.expiry) : '∞ Owner';
            const txt = `${sec('👑 VIP ELITE')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — sei *VIP* 👑✨`)}\n${line(`🌟 _${pushName || 'Leggenda'}_ • glass effect attivo`)}\n${line('')}\n${line(`🔮 Status: _VIP ATTIVO_ 💫`)}\n${line(`⏳ Resta: _${remain}_`)}\n${line(`✨ Tier: _DIAMOND_ • priorità massima`)}\n${line('')}\n${line(`🎁 Privilegi:`)}\n${line(`  ▸ 👑 Badge corona nel profilo`)}\n${line(`  ▸ 💎 Accesso *premiumShop* & *premiumDaily*`)}\n${line(`  ▸ 🚀 Boost illimitati & giochi esclusivi`)}\n${line('')}\n${line(`💫 Grazie per supportare *VEX* 💎`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
        }

        const txt2 = `${sec('👑 DIVENTA VIP')}\n${boxOpen()}\n${line(`✨ @${sender.split('@')[0]} — entra nell' *élite* 👑`)}\n${line(`💎 _Vetro cromato, emoji e priorità_`)}\n${line('')}\n${line(`🌟 Cosa sblocchi:`)}\n${line(`  ▸ 👑 Ruolo VIP in classifica`)}\n${line(`  ▸ 💰 +120€ gift & pregio VIP`)}\n${line(`  ▸ 🎮 Accesso hub *premiumGames*`)}\n${line(`  ▸ 🤖 Sticker & AI premium`)}\n${line('')}\n${line(`💫 Attivazione: chiedi a un *Owner*`)}\n${line(`📊 VIP attivi: _${total}_ • 💎 VEX`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt2, mentions: [sender] }, { quoted: msg });
    },
};
