'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDarkFont } = require('../../lib/font');

module.exports = {
    name: 'setmoney',
    aliases: ['setbalance'],
    description: "Imposta un soldi specifici a un utente (solo owner). Usa: .setmoney <importo> [@menzione|reply]",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, reply, services } = context;
        const { formatMoney, getUser, saveDB, sameJid, getCachedGroupMeta } = services;
        const { dispOf, resolveJid } = require('../../lib/jid');

        if (!isOwner) return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);

        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

        const target = targetJid || (mentioned && mentioned[0]);
        if (!target) return reply(`📌 *${command.toUpperCase()}*\n▸ Tagga un utente o rispondi al suo messaggio.\n▸ Esempio: \`.${command} 2000 @utente\``);
        if (sameJid(target, sender)) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Non puoi modificare i tuoi soldi con questo comando.')}
${boxEnd()}`);

        const amount = parseInt((args.find(a => /^\d+$/.test(a)) || '').replace(/[^\d]/g, ''));
        if (!amount || isNaN(amount)) return reply(`💰 Specifica l'importo in euro.\n▸ Esempio: \`.${command} 2000 @utente\``);

        const targetData = getUser(target, from);
        const prevMoney = targetData.money || 0;
        targetData.money = amount;
        saveDB();

        const diff = amount - prevMoney;
        const verb = diff >= 0 ? 'aggiunti' : 'rimossi';
        const emoji = diff >= 0 ? '➕' : '➖';

        return reply(`💵 *_SOLDI_IMPOSTATI!_*\n━━━━━━━━━━━━━━\n▸ @${disp(target)}: _${prevMoney}€_ → _${amount}€_\n▸ ${emoji} ${verb} _${Math.abs(diff)}€_\n━━━━━━━━━━━━━━\n▸ 💳 Saldo attuale: _${formatMoney(targetData.money)}_\n`);
    },
};
