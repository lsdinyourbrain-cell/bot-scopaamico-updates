'use strict';

const fs = require('fs');

// Termux: usa l'ffmpeg di sistema (pkg install ffmpeg) se ffmpeg-static non c'è
let cachedPath = null;

function getFfmpegPath() {
    if (cachedPath) return cachedPath;

    // 1) Prova ffmpeg-static
    try {
        const staticPath = require('ffmpeg-static');
        if (staticPath && fs.existsSync(staticPath)) {
            cachedPath = staticPath;
            return cachedPath;
        }
    } catch (_) {}

    // 2) Fallback: ffmpeg di sistema (Termux)
    cachedPath = 'ffmpeg';
    return cachedPath;
}

function resolveFfmpeg(ffmpeg) {
    try {
        ffmpeg.setFfmpegPath(getFfmpegPath());
    } catch (_) {}
}

module.exports = { getFfmpegPath, resolveFfmpeg };
