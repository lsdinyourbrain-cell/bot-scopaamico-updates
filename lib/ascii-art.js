'use strict';

// Conversione di un'immagine in arte ASCII.
// `sharp` viene passato come parametro per non doppiarne l'import.

const RAMP = ' .:-=+*#%@';

// buffer: immagine in input. Ritorna una stringa multilinea di arte ASCII.
// cols: numero di colonne (larghezza). L'altezza viene derivata mantenendo
// le proporzioni (le cifre tipografiche sono ~2 volte più alte che larghe).
const imageToAscii = async (sharp, buffer, cols = 90) => {
    const meta = await sharp(buffer).metadata();
    const width = meta.width || 100;
    const height = meta.height || 100;
    const rows = Math.round((height / width) * cols * 0.5);
    const clampedCols = Math.max(16, Math.min(160, cols));
    const clampedRows = Math.max(8, Math.min(80, rows));

    const { data, info } = await sharp(buffer)
        .resize(clampedCols, clampedRows, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const chans = info.channels || 1;
    let out = '';
    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const v = data[y * info.width * chans + x * chans];
            const idx = Math.min(RAMP.length - 1, Math.floor((1 - v / 255) * RAMP.length));
            out += RAMP[idx];
        }
        out += '\n';
    }
    return out.replace(/\n$/, '');
};

module.exports = { imageToAscii, RAMP };