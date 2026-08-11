'use strict';

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
        const { getUser, saveDB, sameJid, formatMoney, randomChoice } = services;

        if (!isGroup) return reply("Il regalo funziona solo nei gruppi.");
        if (!targetJid) return reply("🎁 Tagga la persona a cui vuoi regalare. Esempio: `.regalo @utente 100`");
        if (sameJid(targetJid, sender)) return reply("Non puoi regalare a te stesso!");

        const amount = parseInt((args || []).find((a) => /^\d+$/.test(a)));
        if (!Number.isFinite(amount) || amount <= 0) {
            return reply("Specifica un importo valido. Esempio: `.regalo @utente 100`");
        }

        const me = getUser(sender, from);
        if (me.money < amount) {
            return reply(`Non hai abbastanza soldi. Hai solo *${formatMoney(me.money)}*`);
        }

        // Limite: max 3 regali al giorno per mittente.
        const today = new Date().toDateString();
        me.regali = me.regali || { day: '', n: 0 };
        if (me.regali.day !== today) { me.regali.day = today; me.regali.n = 0; }
        if (me.regali.n >= 3) {
            return reply("⏳ Hai già fatto i tuoi 3 regali di oggi. Torna domani!");
        }
        me.regali.n += 1;

        const target = getUser(targetJid, from);
        me.money -= amount;
        target.money += amount;
        target.regaliRicevuti = (Number(target.regaliRicevuti) || 0) + 1;
        saveDB();

        return sock.sendMessage(from, {
            text:
`╔══════════════════════════════╗
║       🎁 *REGALO!* 🎁
╠══════════════════════════════╣
║  🎀 @${sender.split('@')[0]} ha regalato
║  *${formatMoney(amount)}* a @${targetJid.split('@')[0]}!
║
║  _${randomChoice(GIFT_LINES)}_
║
║  💳 Il tuo saldo: *${formatMoney(me.money)}*
║  📦 Regali dati oggi: ${me.regali.n}/3
╚══════════════════════════════╝`,
            mentions: [sender, targetJid],
        }, { quoted: msg });
    },
};