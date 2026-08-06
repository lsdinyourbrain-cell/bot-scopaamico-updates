'use strict';

const pino = require('pino');

module.exports = {
    name: 'vv',
    aliases: [],
    description: "Esegue il comando .vv.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getContextInfo, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, showProgress } = services;


            const rawCtx = getContextInfo(msg.message);
            const quoted = rawCtx.quotedMessage;

            if (!quoted) {
                return reply("Rispondi a una foto o a un video *Visualizza una volta*.");
            }

            // Dopo che WA consuma il wrapper viewOnce, Baileys espone
            // il contenuto direttamente come imageMessage/videoMessage
            // dentro quotedMessage — senza alcun wrapper viewOnce.
            const viewOnceWrapped =
                quoted.viewOnceMessageV2?.message         ||
                quoted.viewOnceMessage?.message           ||
                quoted.viewOnceMessageV2Extension?.message;

            const targetMessage = viewOnceWrapped || quoted;
            const innerMedia    = targetMessage.imageMessage || targetMessage.videoMessage;

            if (!innerMedia) {
                return reply("Rispondi a una foto o a un video *Visualizza una volta*.");
            }

            try {
                const originalKey = {
                    remoteJid  : rawCtx.remoteJid || from,
                    fromMe     : false,
                    id         : rawCtx.stanzaId,
                    participant: rawCtx.participant || sender,
                };

                const prog = await showProgress(sock, from, { label: 'VIEW ONCE', duration: 2000, quoted: msg });

                const buffer = await downloadMediaMessage(
                    { key: originalKey, message: targetMessage },
                    'buffer',
                    {},
                    {
                        logger         : pino({ level: 'silent' }),
                        reuploadRequest: sock.updateMediaMessage,
                    }
                );

                if (!buffer || buffer.length === 0) {
                    return reply("Il media non è più disponibile sui server di WhatsApp.");
                }

                if (targetMessage.imageMessage) {
                    await sock.sendMessage(from,
                        { image: buffer, caption: "👁️ *View once sbloccato*" },
                        { quoted: msg }
                    );
                    await prog.done("👁️ *View once sbloccato!* ✅");
                } else {
                    await sock.sendMessage(from,
                        { video: buffer, caption: "👁️ *View once sbloccato*" },
                        { quoted: msg }
                    );
                    await prog.done("👁️ *View once sbloccato!* ✅");
                }

            } catch (err) {
                console.error('[vv]', err.message);
                await reply("Non riesco a sbloccare questo media. Il file potrebbe essere scaduto.");
            }
    },
};
