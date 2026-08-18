'use strict';

module.exports = {
    name: 'tag',
    aliases: ['tagga', 'menziona'],
    description: "Tagga tutti nel gruppo. Se rispondi a un messaggio, lo rinvia con tag.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, services } = context;
        const { sameJid } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin.");

        try {
            const meta = await sock.groupMetadata(from);
            const participants = Array.isArray(meta.participants) ? meta.participants : [];
            const botJid = sock.user?.id || null;
            const botLid = sock.user?.lid || null;
            const mentions = participants
                .map(p => p.phoneNumber || p.id || p.jid)
                .filter(jid => jid && (!botJid || !sameJid(jid, botJid)) && (!botLid || !sameJid(jid, botLid)));

            const quoted = msg.message?.extendedTextMessage?.contextInfo;
            const quotedMsg = quoted?.quotedMessage;

            // Se c'è un messaggio quotato, lo rinvia con tag
            if (isReply && quotedMsg) {
                const quotedKey = { remoteJid: from, fromMe: false, id: quoted.stanzaId };

                // Text
                if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
                    const text = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
                    return await sock.sendMessage(from, { text, mentions });
                }

                // Image
                if (quotedMsg.imageMessage) {
                    const stream = await services.downloadContentFromMessage(quotedMsg.imageMessage, 'image');
                    const buffer = [];
                    for await (const chunk of stream) buffer.push(chunk);
                    return await sock.sendMessage(from, {
                        image: Buffer.concat(buffer),
                        caption: quotedMsg.imageMessage.caption || '',
                        mentions,
                    });
                }

                // Video
                if (quotedMsg.videoMessage) {
                    const stream = await services.downloadContentFromMessage(quotedMsg.videoMessage, 'video');
                    const buffer = [];
                    for await (const chunk of stream) buffer.push(chunk);
                    return await sock.sendMessage(from, {
                        video: Buffer.concat(buffer),
                        caption: quotedMsg.videoMessage.caption || '',
                        mentions,
                    });
                }

                // Sticker
                if (quotedMsg.stickerMessage) {
                    const stream = await services.downloadContentFromMessage(quotedMsg.stickerMessage, 'sticker');
                    const buffer = [];
                    for await (const chunk of stream) buffer.push(chunk);
                    return await sock.sendMessage(from, {
                        sticker: Buffer.concat(buffer),
                        mentions,
                    });
                }

                // Audio
                if (quotedMsg.audioMessage) {
                    const stream = await services.downloadContentFromMessage(quotedMsg.audioMessage, 'audio');
                    const buffer = [];
                    for await (const chunk of stream) buffer.push(chunk);
                    return await sock.sendMessage(from, {
                        audio: Buffer.concat(buffer),
                        mimetype: quotedMsg.audioMessage.mimetype || 'audio/mp4',
                        mentions,
                    });
                }

                // Document
                if (quotedMsg.documentMessage) {
                    const stream = await services.downloadContentFromMessage(quotedMsg.documentMessage, 'document');
                    const buffer = [];
                    for await (const chunk of stream) buffer.push(chunk);
                    return await sock.sendMessage(from, {
                        document: Buffer.concat(buffer),
                        fileName: quotedMsg.documentMessage.fileName || 'file',
                        mimetype: quotedMsg.documentMessage.mimetype || 'application/octet-stream',
                        caption: quotedMsg.documentMessage.caption || '',
                        mentions,
                    });
                }

                return reply("⚠️ _[uso]:_ tipo di messaggio non supportato per il reinvio.");
            }

            // Nessun messaggio quotato — tag normale
            const customText = textArgs.trim();
            const tagBody = customText || `📢 *_TAG_*
━━━━━━━━━━━━━━
*Attenzione a tutti!*${meta.subject ? `\n_Messaggio nel gruppo: ${meta.subject}_` : ''}
━━━━━━━━━━━━━━
◈ _Vex Bot_`;

            await sock.sendMessage(from, { text: tagBody, mentions }, { quoted: msg });
        } catch (e) {
            console.error('[tag] error:', e);
            await reply(`⚠️ _[uso]:_ errore: ${e.message}`);
        }
    },
};
