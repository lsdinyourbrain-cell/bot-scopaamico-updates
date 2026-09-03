'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

module.exports = {
    name: 'premiumdaily',
    aliases: ['pdaily', 'dailypremium', 'vipdaily'],
    description: 'Daily premium x3 — solo per utenti Premium.',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, services } = context;
        const { db, getUser, saveDB, randomInt } = services;

        if (!prem.isPremium(db, sender) && !isOwner) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }

        const u = getUser(sender, from);
        const now = Date.now();
        const cd = 20 * 60 * 60 * 1000;
        const last = u.premiumDaily || 0;
        if (now - last < cd) {
            const remain = Math.ceil((cd - (now - last))/3600000);
            const txt = `${sec('⏳ PREMIUM DAILY')}\n${boxOpen()}\n${line(`💎 @${sender.split('@')[0]} — già riscosso ✨`)}\n${line(`⏰ Torna tra _${remain}h_ 🔮`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
        }
        const bonus = randomInt(180, 420);
        u.money = (Number(u.money)||0) + bonus;
        u.premiumDaily = now;
        u.xp = (Number(u.xp)||0) + 25;
        saveDB();

        const txt = `${sec('💎 PREMIUM DAILY')}\n${boxOpen()}\n${line(`👑 @${sender.split('@')[0]} — *PREMIO VIP* ✨🔮`)}\n${line('')}\n${line(`💰 +${bonus}€  •  ⚡ +25 XP` )}\n${line(`💫 _Bonus vetro diamantato x3_`)}\n${line(`👛 Saldo: _${u.money}€_`)}\n${line('')}\n${line(`⏳ Prossimo tra _20h_ 💎`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
    },
};
