'use strict';

module.exports = {
    name: 'setmoney',
    aliases: ['setbalance'],
    description: "Imposta un soldi specifici a un utente (solo owner). Usa: .setmoney <importo> [@menzione|reply]",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, reply, services } = context;
        const { formatMoney, getUser, saveDB, sameJid } = services;

        if (!isOwner) return reply("⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━━━━━\nComando riservato\nall'Owner del bot.\n━━━━━━━━━━━━━━━━━━");

        const target = targetJid || (mentioned && mentioned[0]);
        if (!target) return reply(`📌 *${command.toUpperCase()}*\n▸ Tagga un utente o rispondi al suo messaggio.\n▸ Esempio: \`.${command} 2000 @utente\``);
        if (sameJid(target, sender)) return reply("⚠️ Non puoi modificare i tuoi soldi con questo comando.");

        const amount = parseInt((args.find(a => /^\d+$/.test(a)) || '').replace(/[^\d]/g, ''));
        if (!amount || isNaN(amount)) return reply(`💰 Specifica l'importo in euro.\n▸ Esempio: \`.${command} 2000 @utente\``);

        const targetData = getUser(target, from);
        const prevMoney = targetData.money || 0;
        targetData.money = amount;
        saveDB();

        const diff = amount - prevMoney;
        const verb = diff >= 0 ? 'aggiunti' : 'rimossi';
        const emoji = diff >= 0 ? '➕' : '➖';

        return reply(`💵 *_SOLDI_IMPOSTATI!_*\n━━━━━━━━━━━━━━\n▸ @${target.split('@')[0]}: _${prevMoney}€_ → _${amount}€_\n▸ ${emoji} ${verb} _${Math.abs(diff)}€_\n━━━━━━━━━━━━━━\n▸ 💳 Saldo attuale: _${formatMoney(targetData.money)}_`);
    },
};
