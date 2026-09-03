'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'giftvip',
    aliases: ['regalavip', 'donovip'],
    description: 'Regala VIP/Premium a un altro utente (solo Premium/Owner).',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, isGroup, targetJid, services } = context;
        const { db, saveDB, getCachedGroupMeta, sameJid } = services;

        if (!prem.isPremium(db, sender) && !isOwner) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }
        if (!isGroup) {
            const t = `${sec('👥 SOLO GRUPPI')}\n${boxOpen()}\n${line('💎 Il gift VIP funziona solo nei gruppi ✨')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }
        if (!targetJid) {
            const t = `${sec('💎 GIFT VIP')}\n${boxOpen()}\n${line('👑 Tagga chi vuoi rendere VIP ✨')}\n${line('')}\n${line('📌 Uso: *.giftvip @utente [giorni]*')}\n${line('💫 Esempio: *.giftvip @marco 7*')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }
        if (sameJid(targetJid, sender) && !isOwner) {
            const t = `${sec('💎 GIFT VIP')}\n${boxOpen()}\n${line('✨ Non puoi regalare VIP a te stesso 💎')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

        if (prem.isPremium(db, targetJid)) {
            const t = `${sec('👑 GIÀ VIP')}\n${boxOpen()}\n${line(`💎 @${disp(targetJid)} è già *VIP* ✨`)}\n${line('🔮 _Vetro già attivo_')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t, mentions: [targetJid] }, { quoted: msg });
        }

        let days = parseInt(args.find(a => /^\d+$/.test(a)), 10);
        if (!Number.isFinite(days) || days <= 0) days = 7;
        if (days > 365) days = 365;
        if (!isOwner && days > 14) days = 14;

        prem.addPremium(db, targetJid, days, sender);
        saveDB();

        const txt = `${sec('🎁 VIP REGALATO')}\n${boxOpen()}\n${line(`💎 @${disp(sender)} ha regalato *VIP* a @${disp(targetJid)} 👑✨`)}\n${line(`🔮 _Vetro diamantato attivato!_`)}\n${line('')}\n${line(`⏳ Durata: _${days} giorni_`)}\n${line(`💫 Scadenza: _${prem.formatRemaining(Date.now() + days*86400000)}_`)}\n${line(`✨ Goditi i privilegi premium!`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [sender, targetJid] }, { quoted: msg });
    },
};
