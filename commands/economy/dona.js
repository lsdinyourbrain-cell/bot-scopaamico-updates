'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'dona',
    aliases: ['regala'],
    description: "Dona soldi a un altro utente.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCachedGroupMeta, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('Questo comando funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!targetJid) return reply("Tagga la persona a cui vuoi donare. Esempio: `.dona @utente 100`");
        if (sameJid(targetJid, sender)) return reply("Non puoi donare soldi a te stesso!");

        const amount = parseInt(args.find(a => /^\d+$/.test(a)));
        if (!amount || amount <= 0) return reply("Specifica un importo valido. Esempio: `.dona @utente 100`");

        const senderData = getUser(sender, from);
        if (senderData.money < amount) return reply(`Non hai abbastanza soldi. Hai solo *${formatMoney(senderData.money)}*`);

        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

        const targetData = getUser(targetJid, from);
        senderData.money -= amount;
        targetData.money += amount;
        saveDB();

        await sock.sendMessage(from, {
            text: `${sec('DONAZIONE')}\n${boxOpen()}\n${line(`${sec('DONAZIONE')}\n${boxOpen()}\n${line(`🎁 *_DONAZIONE!_*\n\n▸ @${disp(sender)} ha donato _${amount}€_ a @${disp(targetJid)}! 🫶\n\n▸ 💰 Il tuo saldo: _${formatMoney(senderData.money)}_\n`)}\n${boxEnd()}`)}\n${boxEnd()}`,
            mentions: [sender, targetJid],
        });
    },
};
