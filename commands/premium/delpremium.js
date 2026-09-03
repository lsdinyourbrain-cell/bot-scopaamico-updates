'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'delpremium',
    aliases: ['removepremium', 'delvip', 'removevip'],
    description: 'Owner: rimuove Premium da un utente.',

    async run(sock, msg, args, context) {
        const { from, isOwner, targetJid, services } = context;
        const { db, saveDB, getCachedGroupMeta } = services;

        if (!isOwner) {
            const t = `${sec('🔒 OWNER ONLY')}\n${boxOpen()}\n${line('👑 Solo gli *Owner* possono rimuovere Premium 💎')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }
        if (!targetJid) {
            const t = `${sec('💎 DEL PREMIUM')}\n${boxOpen()}\n${line('👑 Tagga l\'utente da rimuovere ✨')}\n${line('📌 Uso: *.delpremium @utente*')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch(_){}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

        if (!prem.isPremium(db, targetJid)) {
            const t = `${sec('💎 DEL PREMIUM')}\n${boxOpen()}\n${line(`✨ @${disp(targetJid)} non è Premium 💎`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t, mentions: [targetJid] }, { quoted: msg });
        }
        prem.removePremium(db, targetJid);
        saveDB();
        const txt = `${sec('🗑️ PREMIUM RIMOSSO')}\n${boxOpen()}\n${line(`💎 @${disp(targetJid)} non è più *Premium* 💫`)}\n${line(`🔮 Vetro disattivato`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: txt, mentions: [targetJid] }, { quoted: msg });
    },
};
