'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');

const repBar = (rep, max = 100) => {
    const filled = Math.max(0, Math.min(max, Math.round((rep / max) * 10)));
    return '▰'.repeat(filled) + '▱'.repeat(10 - filled);
};

module.exports = {
    name: 'reputazione',
    aliases: ['rep', 'reputation'],
    description: "Guarda la tua reputazione nel gruppo o assegna +1⭐ a un altro utente. Uso: .reputazione oppure .rep @utente",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, mentioned, targetJid, isReply, contextInfo, reply, services } = context;
        const { getUser, saveDB, sameJid, getCachedGroupMeta } = services;

        if (!isGroup) return reply("La reputazione funziona solo nei gruppi.");

        // Visualizzazione del proprio grado.
        if (!targetJid) {
            const u = getUser(sender, from);
            const rep = Number(u.rep) || 0;
            const badge = rep >= 100 ? '👑' : rep >= 50 ? '🌟' : rep >= 20 ? '⭐' : rep >= 5 ? '👍' : '🐣';
            return reply(
`🏷️ *_REPUTAZIONE_*
━━━━━━━━━━━━━━
▸ ${badge} @${sender.split('@')[0]}
▸ ⭐ Punti: _${rep}_
▸ ${repBar(rep)}
━━━━━━━━━━━━━━
▸ 🗳️ _._rep @utente_ per votare
▸ ⏳ _1 voto ogni 6 ore_
◈ _Vex Bot_`);
        }

        if (sameJid(targetJid, sender)) return reply("Non puoi votare te stesso!");

        const me = getUser(sender, from);
        me.repGiven = me.repGiven || {};
        const last = me.repGiven[targetJid] || 0;
        const now = Date.now();
        const CD_MS = 6 * 3600 * 1000;
        if (now - last < CD_MS) {
            const hours = Math.ceil((CD_MS - (now - last)) / 3600000);
            return reply(`⏳ Hai già votato questo utente!\n▸ Riprova tra _${hours} ore_.`);
        }
        me.repGiven[targetJid] = now;

        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

        const target = getUser(targetJid, from);
        target.rep = (Number(target.rep) || 0) + 1;
        saveDB();

        return sock.sendMessage(from, {
            text: `✅ @${disp(sender)} ha dato +1⭐\n▸ a @${disp(targetJid)}!\n▸ 📊 La sua reputazione ora è _${target.rep}_ punti.\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
            mentions: [sender, targetJid],
        }, { quoted: msg });
    },
};