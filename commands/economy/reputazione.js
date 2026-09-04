'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

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

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('La reputazione funziona solo nei gruppi.')}
${boxEnd()}`);

        // Visualizzazione del proprio grado.
        if (!targetJid) {
            const u = getUser(sender, from);
            const rep = Number(u.rep) || 0;
            const badge = rep >= 100 ? '👑' : rep >= 50 ? '🌟' : rep >= 20 ? '⭐' : rep >= 5 ? '👍' : '🐣';
            return sock.sendMessage(from, { text: `${sec('REPUTAZIONE')}\n${boxOpen()}\n${line(`${badge} @${dispOf(sender)}`)}\n${line(`Punti: ${rep}`)}\n${line(repBar(rep))}\n${line('._rep @utente per votare')}\n${line('1 voto ogni 6 ore')}\n${boxEnd()}`, mentions: [sender] }, { quoted: msg });
        }

        if (sameJid(targetJid, sender)) return reply("Non puoi votare te stesso!");

        const me = getUser(sender, from);
        me.repGiven = me.repGiven || {};
        const last = me.repGiven[targetJid] || 0;
        const now = Date.now();
        const CD_MS = 6 * 3600 * 1000;
        if (now - last < CD_MS) {
            const hours = Math.ceil((CD_MS - (now - last)) / 3600000);
            return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`${sec('INFO')}\n${boxOpen()}\n${line(`⏳ Hai già votato questo utente!\n▸ Riprova tra _${hours} ore_.`)}\n${boxEnd()}`)}\n${boxEnd()}`);
        }
        me.repGiven[targetJid] = now;

        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

        const target = getUser(targetJid, from);
        target.rep = (Number(target.rep) || 0) + 1;
        saveDB();

        return sock.sendMessage(from, {
            text: `${sec('INFO')}\n${boxOpen()}\n${line(`${sec('INFO')}\n${boxOpen()}\n${line(`✅ @${disp(sender)} ha dato +1⭐\n▸ a @${disp(targetJid)}!\n▸ 📊 La sua reputazione ora è _${target.rep}_ punti.\n\n`)}\n${boxEnd()}`)}\n${boxEnd()}`,
            mentions: [sender, targetJid],
        }, { quoted: msg });
    },
};