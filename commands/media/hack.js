'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'hack',
    aliases: [],
    description: "Esegue il comando .hack.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sameJid, getCachedGroupMeta } = services;

            if (!targetJid) {
                const t = `${sec('💻 HACK GLASS')}\n${boxOpen()}\n${line('💎 Tagga qualcuno per la scenetta ✨🔮')}\n${line('📌 Uso: *.hack @utente* 💫')}\n${line('😏 _È solo per finta, promesso_')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }

            // Risolve eventuali @lid nel numero di telefono reale
            let tgtPn = targetJid;
            if (targetJid.includes('@lid') && isGroup) {
                try {
                    const meta = await getCachedGroupMeta(sock, from);
                    const hit = (meta?.participants || []).find(p => sameJid(p.id || p.jid, targetJid));
                    if (hit?.phoneNumber) tgtPn = hit.phoneNumber;
                } catch (_) {}
            }

            const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            try {
                const fake = await sock.sendMessage(from, {
                    text: `${sec('💻 HACK GLASS')}\n${boxOpen()}\n${line(`💎 Avvio scenetta su @${tgtPn.split('@')[0]} ✨🔮`)}\n${line('🔍 _Inizializzo vetro..._ 💫')}\n${boxEnd()}`,
                    mentions: [tgtPn],
                }, { quoted: msg });
                await pause(700);
                await sock.sendMessage(from, { text: `${sec('💻 HACK GLASS')}\n${boxOpen()}\n${line(`💎 Target: @${tgtPn.split('@')[0]} ✨`)}\n${line('🔎 _Cerco meme compromettenti..._ 💫')}\n${boxEnd()}`, edit: fake.key, mentions: [tgtPn] });
                await pause(700);
                await sock.sendMessage(from, { text: `${sec('💻 HACK GLASS')}\n${boxOpen()}\n${line(`💎 Target: @${tgtPn.split('@')[0]} ✨`)}\n${line('📦 _Recupero figuracce nel vetro..._ 🔮')}\n${boxEnd()}`, edit: fake.key, mentions: [tgtPn] });
                await pause(700);
                await sock.sendMessage(from, {
                    text: `${sec('✅ HACK COMPLETATO')}\n${boxOpen()}\n${line(`💎 @${tgtPn.split('@')[0]} hackerato — per finta 😭✨`)}\n${line('🔮 _Vetro cromato: missione scenetta_ 💫')}\n${line('💫 _Tutto fake, stai tranquillo_ 💎')}\n${boxEnd()}`,
                    edit: fake.key,
                    mentions: [tgtPn],
                });
            } catch (_) {
                const t = `${sec('❌ ERRORE HACK')}\n${boxOpen()}\n${line('💎 Scenetta impallata ✨')}\n${line('🔮 _Riprova tra poco_ 💫')}\n${boxEnd()}`;
                await sock.sendMessage(from, { text: t }, { quoted: msg });
            }
    },
};
