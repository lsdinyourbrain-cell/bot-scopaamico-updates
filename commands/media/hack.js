'use strict';

module.exports = {
    name: 'hack',
    aliases: [],
    description: "Esegue il comando .hack.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sameJid, getCachedGroupMeta } = services;

            if (!targetJid) return reply("⚠️ _[uso]: tagga una persona: è solo una scenetta, promesso._");

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
                    text: `💻 Avvio la scenetta su @${tgtPn.split('@')[0]}…`,
                    mentions: [tgtPn],
                }, { quoted: msg });
                await pause(700);
                await sock.sendMessage(from, { text: '🔎 Cerco meme compromettenti…', edit: fake.key });
                await pause(700);
                await sock.sendMessage(from, { text: '📦 Recupero un sacco di figuracce…', edit: fake.key });
                await pause(700);
                await sock.sendMessage(from, {
                    text: `✅ Fatto. @${tgtPn.split('@')[0]} è stato/a hackerato/a… per finta 😭`,
                    edit: fake.key,
                    mentions: [tgtPn],
                });
            } catch (_) {
                await reply("❌ La scenetta si è impallata, riprova.");
            }
    },
};
