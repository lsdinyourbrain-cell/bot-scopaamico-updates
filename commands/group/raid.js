'use strict';

module.exports = {
    name: 'raid',
    aliases: [],
    description: "Spamma per tot volte i link di invito ai gruppi con hide tag (richiede admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sameJid } = services;

        const GROUP_LINKS = [
            'https://chat.whatsapp.com/E7wFeNNCLT1J68hXYOV2ZL',
            'https://chat.whatsapp.com/LYLaslLp2DWHARp2hvITQB?s=cl&p=a&mlu=1&amv=0',
        ];

        if (!isGroup) return reply('❌ Funziona solo nei gruppi.');
        if (!isSenderAdmin && !isOwner) return reply('⛔ Solo gli admin del gruppo possono usarlo.');

        let times = parseInt(textArgs.trim(), 10);
        if (isNaN(times) || times < 1) times = 3;
        if (times > 100) times = 100;

        try {
            const meta = await sock.groupMetadata(from);
            const participants = Array.isArray(meta.participants) ? meta.participants : [];
            const allJids = participants.map(p => p.id || p.jid).filter(Boolean);
            // Hide tag: notifica tutti senza mostrare @handle visibili
            const mentions = allJids;

            const body =
`🚨 *RAID!* 🚨

🔥 Entrate subito nei nostri gruppi:

1️⃣ *GRUPPO 1*
${GROUP_LINKS[0]}

2️⃣ *GRUPPO 2*
${GROUP_LINKS[1]}

💣 Non perdete l'occasione!`;

            for (let i = 0; i < times; i++) {
                const hiddenTags = mentions.map(() => '\u200b').join(' ');
                const text = `${body}\n\n${hiddenTags}`;
                await sock.sendMessage(from, { text, mentions }, { quoted: msg });
            }

            await reply(`✅ Raid completato: inviato *${times}* volte con hide tag a *${allJids.length}* membri.`);
        } catch (e) {
            console.error('[raid]', e.message);
            await reply('❌ Errore in raid: ' + e.message);
        }
    },
};