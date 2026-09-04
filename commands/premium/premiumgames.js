'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

module.exports = {
    name: 'premiumgames',
    aliases: ['pgames', 'vipgames', 'gamespremium'],
    description: 'Hub giochi premium con moltiplicatore vincite.',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, services } = context;
        const { db, getUser, saveDB } = services;
        if (!prem.isPremium(db, sender) && !isOwner) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }
        const u = getUser(sender, from);
        // Bonus casuale premium games: 40% chance 30-90€ se non già oggi
        const today = new Date().toDateString();
        if (u.pgamesDay !== today && Math.random() < 0.6) {
            const win = Math.floor(Math.random()*60)+30;
            u.money = (Number(u.money)||0)+ win;
            u.pgamesDay = today;
            saveDB();
            const txt = `${sec('🎮 PREMIUM GAMES')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — *BONUS PREMIUM* ✨🎰`)}\n${line(`🔮 _Jackpot vetro attivato!_`)}\n${line('')}\n${line(`🎉 Hai vinto _${win}€_ nel hub premium!`)}\n${line(`💰 Saldo: _${u.money}€_`)}\n${line('')}\n${line(`🎮 Giochi potenziati:`)}\n${line(`  ▸ 🎲 Dadi +15% payout`)}\n${line(`  ▸ 🎰 Slot bonus garantito`)}\n${line(`  ▸ ♠️ Blackjack payout x1.2`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
        }

        const txt2 = `${sec('🎮 PREMIUM GAMES')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — *HUB ELITE* 🎮✨`)}\n${line(`🔮 _Accesso vetro diamantato_`)}\n${line('')}\n${line(`🌟 Benefici attivi:`)}\n${line(`  ▸ 🎲 Dadi, Slot, Roulette +15%`)}\n${line(`  ▸ 🃏 Blackjack & Poker boost`)}\n${line(`  ▸ 🎯 Quiz & Memoria reward x2`)}\n${line('')}\n${line(`💫 Gioca con *.dadi* *.slot* *.blackjack*`)}\n${line(`💎 Le vincite sono maggiorate!`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt2, mentions: [sender] }, { quoted: msg });
    },
};
