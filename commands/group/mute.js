'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDecorated } = require('../../lib/font');
const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'mute',
    aliases: ["unmute", "muta", "smuta", "riabilita"],
    description: "Silenzia o riattiva un utente nel gruppo: .mute @utente / .unmute @utente.",

    async run(sock, msg, args, context) {
        const { command, from, sender, isGroup, isSenderAdmin, isBotAdmin, targetJid, isReply, contextInfo, reply, services } = context;
        const { db, getUser, saveDB, logGroupEvent, sameJid, isOwnerJid, getCachedGroupMeta, sendButtons } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin possono mutare.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");

        // targetJid: reply = quoted participant, mention = @tag
        let tgt = targetJid;
        if (!tgt && isReply) {
            const quoted = contextInfo?.quotedMessage;
            if (quoted) {
                const fromMaybe = contextInfo?.participant || contextInfo?.remoteJid;
                if (fromMaybe) tgt = fromMaybe;
            }
        }
        if (!tgt) return reply("⚠️ _[uso]:_ rispondi a un messaggio o tagga la persona da mutare.");
        if (sameJid(tgt, sender)) return reply("⚠️ _[uso]:_ non puoi mutarti da solo.");
        if (isOwnerJid(tgt, sock, db, null)) return reply("⛔ Non posso mutare l'owner del bot.");

        const targetData = getUser(tgt, from);

        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const tgtPn = resolveJid(tgt, meta);
        const useJid = tgtPn || tgt;
        const short = dispOf(useJid);

        if (command === 'unmute' || command === 'smuta' || command === 'riabilita') {
            targetData.isMuted = false;
            saveDB();
            logGroupEvent(from, 'unmute', sender, null, tgt, 'riabilitato (può scrivere)');
            return await sendButtons(sock, from,
                `🔊 ${sec('UNMUTE')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} può *scrivere di nuovo*.\n━━━━━━━━━━━━━━━━━━\n`,
                [{ label: '📜 Registro modifiche', id: 'registro' }], msg, [useJid])
                .catch(() => sock.sendMessage(from, { text: `🔊 ${sec('UNMUTE')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} può *scrivere di nuovo*.\n━━━━━━━━━━━━━━━━━━\n`, mentions: [useJid] }, { quoted: msg }));
        }

        targetData.isMuted = true;
        saveDB();
        logGroupEvent(from, 'mute', sender, null, tgt, 'mutato (non può scrivere)');

        await sendButtons(sock, from,
            `🔇 ${sec('MUTE')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato *mutato* permanentemente.\n━━━━━━━━━━━━━━━━━━\n`,
            [{ label: '📜 Registro modifiche', id: 'registro' }], msg, [useJid])
            .catch(() => sock.sendMessage(from, {
                text: `🔇 ${sec('MUTE')}\n━━━━━━━━━━━━━━━━━━\n▸ @${short} è stato *mutato* permanentemente.\n━━━━━━━━━━━━━━━━━━\n`,
                mentions: [useJid],
            }, { quoted: msg }));
    },
};