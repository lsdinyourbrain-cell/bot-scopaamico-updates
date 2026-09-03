'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

module.exports = {
    name: 'boostxp',
    aliases: ['xpturbo', 'xpboost', 'boostexp'],
    description: 'Boost XP premium: +XP immediati (solo Premium).',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, services } = context;
        const { db, getUser, saveDB } = services;
        if (!prem.isPremium(db, sender) && !isOwner) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }
        const u = getUser(sender, from);
        if (!u.cooldowns) u.cooldowns = {};
        const now = Date.now();
        const cd = 8 * 60 * 60 * 1000;
        const last = u.cooldowns.boostxp || 0;
        if (now - last < cd) {
            const remain = Math.ceil((cd - (now-last))/60000);
            const txt = `${sec('⏳ BOOSTXP COOLDOWN')}\n${boxOpen()}\n${line(`⚡ @${sender.split('@')[0]} — XP in ricarica ✨`)}\n${line(`⏳ Tra _${remain} minuti_ 🔮`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
        }
        u.cooldowns.boostxp = now;
        const gain = Math.floor(Math.random()*60)+50;
        u.xp = (Number(u.xp)||0)+ gain;
        // tentativo level up semplice
        const need = 1000; // placeholder, reale calcolato da xp lib altrove
        saveDB();
        const txt = `${sec('⚡ BOOST XP')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — *TURBO XP* ✨`)}\n${line(`🔮 _Cristallo XP sprigionato!_`)}\n${line('')}\n${line(`⚡ +${gain} XP • ⭐ Totale: _${u.xp}_`)}\n${line(`🌟 Continua così, leggenda!`)}\n${line('')}\n${line(`⏳ Prossimo tra _8 ore_ 💎`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
    },
};
