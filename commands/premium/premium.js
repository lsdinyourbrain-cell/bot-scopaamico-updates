'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');

module.exports = {
    name: 'premium',
    aliases: ['prem', 'abbonamento'],
    description: 'Mostra il tuo stato Premium e i vantaggi esclusivi.',

    async run(sock, msg, args, context) {
        const { from, sender, pushName, isOwner, reply, services } = context;
        const { db, getUser } = services;

        const info = prem.getPremiumInfo(db, sender);
        const isPrem = prem.isPremium(db, sender) || isOwner;
        const totalPrem = prem.listPremium(db).length;

        if (isPrem) {
            const remain = info ? prem.formatRemaining(info.expiry) : '∞ Owner permanente';
            const since = info?.addedAt ? new Date(info.addedAt).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT');
            const txt = `${sec('💎 PREMIUM ATTIVO')}\n${boxOpen()}\n${line(`✨ Ciao @${dispOf(sender)} — sei *PREMIUM* 💎`)}\n${line(`👑 _${pushName || 'Campione'}_ • vetro diamantato`)}\n${line('')}\n${line(`💫 Stato: _ATTIVO_ ✨`)}\n${line(`⏳ Scadenza: _${remain}_`)}\n${line(`📅 Dal: _${since}_`)}\n${line(`🌟 Benefici sbloccati:`)}\n${line(`  ▸ 💰 Daily x3 & bonus esclusivi`)}\n${line(`  ▸ 🎮 Giochi premium & jackpot ++`)}\n${line(`  ▸ 🤖 AI illimitata & sticker VIP`)}\n${line(`  ▸ 🚀 Boost XP + priorità coda`)}\n${line('')}\n${line(`👥 Premium totali: _${totalPrem}_ • 💎 VEX ELITE`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
        }

        const text = `${sec('💎 DIVENTA PREMIUM')}\n${boxOpen()}\n${line(`✨ Ciao @${dispOf(sender)} — sblocca il *VETRO PREMIUM* 🔮`)}\n${line(`💎 _Esperienza ultra glass, zero limiti_`)}\n${line('')}\n${line(`🌟 Vantaggi esclusivi:`)}\n${line(`  ▸ 💰 *PremiumDaily* — 3x ricompense`)}\n${line(`  ▸ 🎰 *PremiumShop* — oggetti leggendari`)}\n${line(`  ▸ 🎮 *PremiumGames* — vincite maggiorate`)}\n${line(`  ▸ 🤖 *PremiumAI* — senza coda`)}\n${line(`  ▸ ⚡ *Boost* & *BoostXP* istantanei`)}\n${line(`  ▸ 💎 Badge diamante nel profilo`)}\n${line('')}\n${line(`💫 Prezzo: _contatta Owner_ • attivazione istantanea`)}\n${line(`📩 Usa *.vip* per dettagli VIP`)}\n${line(`👥 Già Premium: _${totalPrem}_ utenti`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text, mentions: [sender] }, { quoted: msg });
    },
};
