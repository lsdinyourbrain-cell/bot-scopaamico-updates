'use strict';

const repBar = (rep, max = 100) => {
    const filled = Math.max(0, Math.min(max, Math.round((rep / max) * 10)));
    return '▰'.repeat(Math.max(1, filled || 1)) + '▱'.repeat(Math.max(0, 10 - filled));
};

module.exports = {
    name: 'reputazione',
    aliases: ['rep', 'reputation'],
    description: "Guarda la tua reputazione nel gruppo o assegna +1⭐ a un altro utente. Uso: .reputazione oppure .rep @utente",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, mentioned, targetJid, isReply, contextInfo, reply, services } = context;
        const { getUser, saveDB, sameJid } = services;

        if (!isGroup) return reply("La reputazione funziona solo nei gruppi.");

        // Visualizzazione del proprio grado.
        if (!targetJid) {
            const u = getUser(sender, from);
            const rep = Number(u.rep) || 0;
            const badge = rep >= 100 ? '👑' : rep >= 50 ? '🌟' : rep >= 20 ? '⭐' : rep >= 5 ? '👍' : '🐣';
            return reply(
`🏷️ *REPUTAZIONE*
━━━━━━━━━━━━━━━━━━
${badge} @${sender.split('@')[0]}
⭐ *${rep}* punti
${repBar(rep)}

_._rep @utente per votare_
_(1 voto ogni 6 ore)_
━━━━━━━━━━━━━━━━━━`);
        }

        if (sameJid(targetJid, sender)) return reply("Non puoi votare te stesso!");

        const me = getUser(sender, from);
        me.repGiven = me.repGiven || {};
        const last = me.repGiven[targetJid] || 0;
        const now = Date.now();
        const CD_MS = 6 * 3600 * 1000;
        if (now - last < CD_MS) {
            const hours = Math.ceil((CD_MS - (now - last)) / 3600000);
            return reply(`⏳ Hai già votato questo utente! Riprova tra *${hours}* ore.`);
        }
        me.repGiven[targetJid] = now;

        const target = getUser(targetJid, from);
        target.rep = (Number(target.rep) || 0) + 1;
        saveDB();

        return sock.sendMessage(from, {
            text: `✅ @${sender.split('@')[0]} ha dato +1⭐\na @${targetJid.split('@')[0]}!\n\n📊 La sua reputazione\nora è *${target.rep}* punti.`,
            mentions: [sender, targetJid],
        }, { quoted: msg });
    },
};