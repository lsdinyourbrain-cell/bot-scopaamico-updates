'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { dispOf, resolveJid } = require('../../lib/jid');

const GIFT_LINES = [
    '🎀 Ti ho incartato un po\' di amicizia, buon uso!',
    '🎁 Spero che ti piaccia: l\'ho scelto con (quasi) amore!',
    '💝 Non ci provare, è solo un regalo… o forse no!',
    '🎀 Ecco, adesso spendi meglio di me!',
    '✨ Un regalino per illuminarti la giornata!',
];

module.exports = {
    name: 'regalo',
    aliases: ['gift', 'regalino'],
    description: "Manda un regalo di soldi a un altro utente (max 3 al giorno). Uso: .regalo @utente <importo>",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, mentioned, targetJid, isReply, contextInfo, reply, services } = context;
        const { getUser, saveDB, sameJid, formatMoney, randomChoice, getCachedGroupMeta } = services;

        if (!isGroup) {
            const t = `${sec('👥 SOLO GRUPPI')}\n${boxOpen()}\n${line('🎀 Il regalo funziona solo nei gruppi 💎')}\n${line('🔮 _Vetro condiviso solo in gruppo_')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }
        if (!targetJid) {
            const t = `${sec('🎀 REGALO GLASS')}\n${boxOpen()}\n${line('💎 Tagga chi vuoi sorprendere ✨')}\n${line('📌 Uso: *.regalo @utente 100* 🎁')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }
        if (sameJid(targetJid, sender)) {
            const t = `${sec('🎀 REGALO')}\n${boxOpen()}\n${line('✨ Non regalare a te stesso, condividi! 💫')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        const amount = parseInt((args || []).find((a) => /^\d+$/.test(a)));
        if (!Number.isFinite(amount) || amount <= 0) {
            const t = `${sec('🎀 REGALO')}\n${boxOpen()}\n${line('💎 Importo non valido ✨')}\n${line('📌 Esempio: *.regalo @marco 100*')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        const me = getUser(sender, from);
        if (me.money < amount) {
            const t = `${sec('💸 FONDI INSUFFICIENTI')}\n${boxOpen()}\n${line(`💎 Hai solo _${formatMoney(me.money)}_ ✨`)}\n${line('🔮 _Ricarica con daily/work_')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t, mentions: [sender] }, { quoted: msg });
        }

        const today = new Date().toDateString();
        me.regali = me.regali || { day: '', n: 0 };
        if (me.regali.day !== today) { me.regali.day = today; me.regali.n = 0; }
        if (me.regali.n >= 3) {
            const t = `${sec('⏳ LIMITE GIORNALIERO')}\n${boxOpen()}\n${line('🎀 Hai già fatto 3 regali oggi 💎')}\n${line('⏳ Torna domani, generoso! 💫')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }
        me.regali.n += 1;

        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

        const target = getUser(targetJid, from);
        me.money -= amount;
        target.money += amount;
        target.regaliRicevuti = (Number(target.regaliRicevuti) || 0) + 1;
        saveDB();

        const giftTxt = `${sec('🎀 REGALO GLASS')}\n${boxOpen()}\n${line(`💎 @${disp(sender)} → @${disp(targetJid)} ✨🎁`)}\n${line(`🔮 _Cristallo dono nel vetro_`)}\n${line('')}\n${line(`🎁 Donato: _${formatMoney(amount)}_ 💫`)}\n${line(`_${randomChoice(GIFT_LINES)}_ ✨`)}\n${line(`💳 Saldo: _${formatMoney(me.money)}_ • 📦 _${me.regali.n}/3_ oggi`)}\n${boxEnd()}`;
        return sock.sendMessage(from, { text: giftTxt, mentions: [sender, targetJid] }, { quoted: msg });
    },
};