'use strict';

// .wm (watermark): clona lo sticker a cui si risponde cambiandogli il nome
// (sticker-pack-name nel metadata EXIF). Uso: .wm <titolo>
// Esempio: rispondi a uno sticker e scrivi .wm denunciarsi

const webpmux = require('node-webpmux');

module.exports = {
    name: 'wm',
    aliases: ['watermark', 'renamesticker', 'rinomina'],
    description: "Clona lo sticker a cui rispondi cambiandogli il nome/titolo. Uso: .wm <titolo>",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { downloadContentFromMessage, fs, os, path, showProgress } = services;

        const newTitle = (textArgs || '').trim();
        if (!newTitle) {
            return reply("Scrivi il nuovo titolo da dare allo sticker. Esempio: .wm denunciarsi");
        }
        if (newTitle.length > 100) {
            return reply("Titolo troppo lungo (max 100 caratteri).");
        }

        // Estrai lo sticker dal messaggio citato
        const quoted = isReply ? (contextInfo?.quotedMessage || {}) : {};
        const stickerMsg = quoted.stickerMessage
            || quoted.ephemeralMessage?.message?.stickerMessage
            || msg.message?.stickerMessage;

        if (!stickerMsg) {
            return reply("Rispondi a uno sticker per clonarlo col nuovo nome.");
        }

        const prog = await showProgress(sock, from, {
            label: 'CLONA STICKER',
            duration: 4000,
            steps: 8,
            quoted: msg,
        });

        try {
            // 1. Scarica lo sticker
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            if (!buffer.length) throw new Error('download vuoto');

            // 2. Scrivi su file temporaneo
            const stamp = Date.now();
            const tempPath = path.join(os.tmpdir(), 'wm_' + stamp + '.webp');
            fs.writeFileSync(tempPath, buffer);

            // 3. Riscrivi l EXIF col nuovo nome
            const img = new webpmux.Image();
            await img.load(tempPath);

            const exifData = {
                'sticker-pack-id': 'com.vexbot.bot.wm',
                'sticker-pack-name': newTitle,
                'sticker-pack-publisher': 'VexBot',
                emojis: ['✨'],
            };

            const jsonStr = JSON.stringify(exifData);
            const jsonBuff = Buffer.from(jsonStr, 'utf-8');
            const exifAttr = Buffer.from([
                0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
                0x01, 0x00, 0x41, 0x57, 0x07, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
            ]);
            const exif = Buffer.concat([exifAttr, jsonBuff]);
            exif.writeUIntLE(jsonBuff.length, 14, 4);

            img.exif = exif;
            await img.save(tempPath);

            // 4. Invia lo sticker clonato
            await sock.sendMessage(from, {
                sticker: fs.readFileSync(tempPath),
            }, { quoted: msg });

            try { fs.unlinkSync(tempPath); } catch (_) {}

            await prog.done('Sticker clonato con titolo: ' + newTitle + ' ✅');
        } catch (err) {
            console.error('[wm]', err.message);
            await prog.fail('Errore nella clonazione dello sticker. Verifica che sia uno sticker valido.');
        }
    },
};