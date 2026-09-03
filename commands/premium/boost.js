'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

module.exports = {
    name: 'boost',
    aliases: ['potenzia', 'turbo'],
    description: 'Boost premium: +XP e +soldi istantanei (solo Premium).',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, services } = context;
        const { db, getUser, saveDB } = services;

        if (!prem.isPremium(db, sender) && !isOwner) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }

        const u = getUser(sender, from);
        if (!u.cooldowns) u.cooldowns = {};
        const now = Date.now();
        const cd = 6 * 60 * 60 * 1000;
        const last = u.cooldowns.boost || 0;
        if (now - last < cd) {
            const remain = Math.ceil((cd - (now - last)) / 60000);
            const txt = `${sec('⏳ BOOST COOLDOWN')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — turbo in ricarica ✨`)}\n${line(`⏳ Riprova tra _${remain} minuti_`)}\n${line(`💫 _Il vetro si ricarica..._ 🔮`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
        }
        u.cooldowns.boost = now;
        const gainMoney = Math.floor(Math.random() * 80) + 60;
        const gainXp = Math.floor(Math.random() * 40) + 25;
        u.money = (Number(u.money) || 0) + gainMoney;
        u.xp = (Number(u.xp) || 0) + gainXp;
        // livello auto? lascia a xp lib
        saveDB();

        const txt = `${sec('🚀 BOOST ATTIVATO')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — *TURBO PREMIUM* ✨`)}\n${line(`🔮 _Glass boost sprigionato!_`)}\n${line('')}\n${line(`💰 +${gainMoney}€ • ⚡ +${gainXp} XP`)}\n${line(`👑 Saldo: _${u.money}€_ • ⭐ XP: _${u.xp}_`)}\n${line('')}\n${line(`💫 Prossimo boost tra _6 ore_ • ricarica cristallo 💎`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
    },
};
