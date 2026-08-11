'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');
const { createStickerExif } = require('./stickerExif');

// Converte un buffer immagine (png/jpg/webp) in uno sticker webp 512x512
// con i metadati del pack. `sharp` e `webpmux` vengono passati come
// parametri per non doppiarne l'import nel ciclo di vita del bot.
// Ritorna un Buffer pronto per sock.sendMessage({ sticker }). 
const makeSticker = async (sharp, webpmux, input, { quality = 90, size = 512 } = {}) => {
    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`);
    try {
        await sharp(input)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality })
            .toFile(tempPath);

        try {
            const img = new webpmux.Image();
            await img.load(tempPath);
            img.exif = createStickerExif();
            await img.save(tempPath);
        } catch (_) {
            // Se l'iniezione EXIF fallisce, lo sticker resta comunque valido.
        }

        return fs.readFileSync(tempPath);
    } finally {
        try { fs.unlinkSync(tempPath); } catch (_) {}
    }
};

module.exports = { makeSticker };