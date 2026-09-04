'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

module.exports = {
    name: 'elite',
    aliases: ['elitestatus', 'elitebadge'],
    description: 'Badge Elite premium con grafica glass.',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, services } = context;
        const { db, getUser } = services;
        const u = getUser(sender, from);
        const isElite = prem.isPremium(db, sender) || isOwner;
        const remain = prem.getPremiumInfo(db, sender) ? prem.formatRemaining(prem.getPremiumInfo(db, sender).expiry) : '∞';

        if (!isElite) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }

        const level = u.level || 1;
        const xp = u.xp || 0;
        const txt = `${sec('🌟 ELITE STATUS')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — *ELITE* 👑✨`)}\n${line(`🔮 _Cristallo d'élite attivo_`)}\n${line('')}\n${line(`⭐ Livello: _${level}_ • XP: _${xp}_`)}\n${line(`👑 Tier: _ELITE DIAMOND_ 💎`)}\n${line(`⏳ Scadenza: _${remain}_`)}\n${line('')}\n${line(`🌟 Benefici Elite:`)}\n${line(`  ▸ 🚀 Boost ogni 4h`)}\n${line(`  ▸ 🎮 Moltiplicatore giochi x1.5`)}\n${line(`  ▸ 💫 Priorità assoluta nei comandi`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
    },
};
