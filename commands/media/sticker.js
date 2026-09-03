'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'sticker',
    aliases: ["s"],
    description: "Trasforma un'immagine o un video in sticker. Invia o rispondi a un media con .s",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { downloadContentFromMessage, downloadMediaMessage, sharp, fs, os, path, ffmpeg, webpmux } = services;

            // Individua il media: allegato direttamente o quotato
            // (gestisce anche ephemeral e view-once).
            const quotedRaw = contextInfo?.quotedMessage || {};
            const quotedInner = quotedRaw.imageMessage || quotedRaw.videoMessage
                || quotedRaw.ephemeralMessage?.message?.imageMessage
                || quotedRaw.ephemeralMessage?.message?.videoMessage
                || quotedRaw.viewOnceMessage?.message?.imageMessage
                || quotedRaw.viewOnceMessage?.message?.videoMessage
                || quotedRaw.viewOnceMessageV2?.message?.imageMessage
                || quotedRaw.viewOnceMessageV2?.message?.videoMessage;
            const quotedMedia = quotedInner;
            const directMedia = msg.message?.imageMessage || msg.message?.videoMessage;

            const media = directMedia || quotedMedia;
            if (!media) {
                const t = `${sec('🖼️ STICKER GLASS')}\n${boxOpen()}\n${line('💎 Invia o rispondi a immagine/video ✨🔮')}\n${line('📌 Uso: *.sticker* / *.s* 💫')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }

            try {
                // 1. Scarichiamo il file. Usiamo downloadContentFromMessage
                //    direttamente sul contenuto media (stesso percorso di
                //    .toimg e .wm, collaudato sui media quotati). Se l'URL è
                //    scaduto, ripieghiamo su downloadMediaMessage con
                //    reuploadRequest che chiede a WhatsApp di ri-caricarlo.
                const isVideo = media.mimetype?.includes('video');
                const mediaType = isVideo ? 'video' : 'image';

                let buffer;
                try {
                    const stream = await downloadContentFromMessage(media, mediaType);
                    buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                } catch (dlErr) {
                    console.error('[sticker] download diretto fallito, provo reupload:', dlErr.message);
                    const mediaMsg = quotedMedia ? {
                        key: {
                            remoteJid  : from,
                            fromMe     : false,
                            id         : contextInfo?.stanzaId,
                            participant: contextInfo?.participant || sender,
                        },
                        message: isVideo ? { videoMessage: quotedMedia } : { imageMessage: quotedMedia },
                    } : msg;
                    buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
                        logger         : console,
                        reuploadRequest: sock.updateMediaMessage,
                    });
                }

                if (!buffer || buffer.length === 0) {
                    const t = `${sec('❌ STICKER ERRORE')}\n${boxOpen()}\n${line('💎 Media non disponibile ✨')}\n${line('🔮 _Reinvia il file, vetro scaduto_ 💫')}\n${boxEnd()}`;
                    return sock.sendMessage(from, { text: t }, { quoted: msg });
                }

                const stamp = Date.now();
                const tempPath = path.join(os.tmpdir(), `${stamp}.webp`);

                // 2. Conversione in WebP (Immagine o Video)
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

                // 3. Iniezione Metadati EXIF (Nome del pack e autore)
                const img = new webpmux.Image();
                await img.load(tempPath);

                const exifData = {
                    "sticker-pack-id": "com.snowcorp.stickerly.android.stickercontentprovider b5e7275f-f1de-4137-961f-57becfad34f2",
                    "sticker-pack-name": "VexBot",
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

                // 4. Invia lo sticker finito
                await sock.sendMessage(from, { sticker: fs.readFileSync(tempPath) }, { quoted: msg });
                try { fs.unlinkSync(tempPath); } catch (e) {}

            } catch (err) {
                console.error('[sticker]', err.message);
                const t = `${sec('❌ STICKER ERRORE')}\n${boxOpen()}\n${line('💎 Errore vetro sticker ✨')}\n${line('🔮 _File forse corrotto, riprova_ 💫')}\n${boxEnd()}`;
                await sock.sendMessage(from, { text: t }, { quoted: msg });
            }
    },
};