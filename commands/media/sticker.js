'use strict';

module.exports = {
    name: 'sticker',
    aliases: ["s"],
    description: "Esegue il comando .sticker.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const replyText = `╭──── 🤖 *ScopaAmicoBot* ────╮\n` +
                              `│\n` +
                              `│ ⏳ *Elaborazione in corso...*\n` +
                              `│ ⚙️ *Conversione multimediale avviata.*\n` +
                              `│ \n` +
                              `│ 💡 *Nota:* Per sticker animati perfetti,\n` +
                              `│ tieni i video sotto i 6 secondi!\n` +
                              `│\n` +
                              `╰────────────────────────────╯`;
            await sock.sendMessage(from, { text: replyText }, { quoted: msg });

            const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
            const quotedRaw = contextInfo.quotedMessage || {};
            const quotedInner = quotedRaw.imageMessage || quotedRaw.videoMessage
                || quotedRaw.ephemeralMessage?.message?.imageMessage
                || quotedRaw.ephemeralMessage?.message?.videoMessage
                || quotedRaw.viewOnceMessage?.message?.imageMessage
                || quotedRaw.viewOnceMessage?.message?.videoMessage
                || quotedRaw.viewOnceMessageV2?.message?.imageMessage
                || quotedRaw.viewOnceMessageV2?.message?.videoMessage;
            const quotedMedia = quotedInner;
            const directMedia = msg.message?.imageMessage || msg.message?.videoMessage;

            if (!directMedia && !quotedMedia) {
                return await reply("Invia o rispondi a un’immagine o a un video per creare lo sticker.");
            }
            
            try {
                // 1. Identifichiamo il media corretto e il tipo
                const media = directMedia || quotedMedia;
                const isVideo = media.mimetype?.includes('video');
                const mediaType = isVideo ? 'video' : 'image';
                
                // 2. Scarichiamo il file usando downloadMediaMessage con
                //    reuploadRequest: se l'URL del media quotato è scaduto,
                //    Baileys chiede a WhatsApp di ri-caricarlo. Per il media
                //    allegato direttamente usiamo il messaggio originale, per
                //    quello quotato ricostruiamo un messaggio valido.
                const mediaMsg = quotedMedia ? {
                    key: {
                        remoteJid  : from,
                        fromMe     : false,
                        id         : contextInfo.stanzaId,
                        participant: contextInfo.participant || sender,
                    },
                    message: isVideo ? { videoMessage: quotedMedia } : { imageMessage: quotedMedia },
                } : msg;

                const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
                    logger         : console,
                    reuploadRequest: sock.updateMediaMessage,
                });
                
                const stamp = Date.now();
                const tempPath = path.join(os.tmpdir(), `${stamp}.webp`);

                // 3. Conversione in WebP (Immagine o Video)
                if (!isVideo) {
                    await sharp(buffer)
                        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .webp({ lossless: true })
                        .toFile(tempPath);
                } 
                else {
                    const inputPath = path.join(os.tmpdir(), `${stamp}.mp4`);
                    fs.writeFileSync(inputPath, buffer);
                    
                    await new Promise((resolve, reject) => {
                        ffmpeg(inputPath)
                            .inputOptions(['-t 6'])
                            .outputOptions([
                                '-vcodec libwebp',
                                '-filter:v fps=15,scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=0x00000000',
                                '-pix_fmt yuva420p',
                                '-fs 1M',
                                '-loop 0'
                            ])
                            .save(tempPath)
                            .on('end', resolve)
                            .on('error', reject);
                    });
                    try { fs.unlinkSync(inputPath); } catch (e) {}
                }

                // 4. Iniezione Metadati EXIF (Nome del pack e autore)
                const img = new webpmux.Image();
                await img.load(tempPath);
                
                const exifData = {
                    "sticker-pack-id": "com.snowcorp.stickerly.android.stickercontentprovider b5e7275f-f1de-4137-961f-57becfad34f2",
                    "sticker-pack-name": "ScopaAmicoBot",
                    "sticker-pack-publisher": "bot di ᗪ乇几ㄩ几匚丨卂尺丂丨 +1 (548) 314-7193",
                    "emojis": ["🤖"]
                };
                
                const jsonStr = JSON.stringify(exifData);
                const jsonBuff = Buffer.from(jsonStr, "utf-8");
                const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                const exif = Buffer.concat([exifAttr, jsonBuff]);
                
                exif.writeUIntLE(jsonBuff.length, 14, 4); 

                img.exif = exif;
                await img.save(tempPath);

                // 5. Invia lo sticker finito
                await sock.sendMessage(from, { sticker: fs.readFileSync(tempPath) }, { quoted: msg });
                try { fs.unlinkSync(tempPath); } catch (e) {}

            } catch (err) {
                console.error('[sticker]', err.message);
                // Ho aggiunto 'await' qui per assicurarmi che il messaggio di errore parta sempre
                await reply("❌ Errore durante la creazione dello sticker. Verifica che il file non sia corrotto.");
            }
    },
};
