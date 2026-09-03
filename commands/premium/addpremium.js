'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'addpremium',
    aliases: ['addvip', 'setpremium', 'premiumadd'],
    description: 'Owner: aggiunge Premium a un utente (giorni opzionali).',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, isGroup, targetJid, services } = context;
        const { db, saveDB, getCachedGroupMeta } = services;

        if (!isOwner) {
            const t = `${sec('🔒 OWNER ONLY')}\n${boxOpen()}\n${line('👑 Solo gli *Owner* possono aggiungere Premium 💎')}\n${line('✨ Contatta +1(548)314-7193')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }
        if (!targetJid) {
            const t = `${sec('💎 ADD PREMIUM')}\n${boxOpen()}\n${line('👑 Tagga l\'utente da rendere VIP ✨')}\n${line('')}\n${line('📌 Uso: *.addpremium @utente [giorni]*')}\n${line('💫 Esempio: *.addpremium @marco 30* → 30 giorni')}\n${line('♾️ Senza giorni → *permanente*')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        let meta = null;
        try { if (isGroup) meta = await getCachedGroupMeta(sock, from); } catch(_){}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

        let days = parseInt(args.find(a=>/^\d+$/.test(a)),10);
        if (!Number.isFinite(days) || days <= 0) days = 0;
        if (days > 3650) days = 3650;

        prem.addPremium(db, targetJid, days, sender);
        saveDB();

        const dur = days ? `${days} giorni` : '♾️ PERMANENTE';
        const remain = days ? prem.formatRemaining(Date.now()+days*86400000) : '∞ permanente';
        const txt = `${sec('✅ PREMIUM AGGIUNTO')}\n${boxOpen()}\n${line(`💎 @${disp(targetJid)} ora è *PREMIUM* 👑✨`)}\n${line(`🔮 _Vetro cromato attivato_`)}\n${line('')}\n${line(`⏳ Durata: _${dur}_`)}\n${line(`📅 Scadenza: _${remain}_`)}\n${line(`👑 Attivato da Owner ✨`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [targetJid] }, { quoted: msg });
    },
};
