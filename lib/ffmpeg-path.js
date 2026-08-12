'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');

// Risolve il PERCORSO ASSOLUTO e VERIFICATO di ffmpeg (es. su Termux:
// /data/data/com.termux/files/usr/bin/ffmpeg). Un percorso assoluto è
// indispensabile per yt-dlp: se gli passi solo il nome (es. "ffmpeg"),
// versioni vecchie lo cercano come file relativo alla cartella di lavoro e
// va in errore anche se ffmpeg è installato ("ffmpeg not found").
let cached = null;
let tried = false;

const checkVersion = (cmd) => {
    try {
        const out = execFileSync(cmd, ['-version'], {
            timeout: 8000,
            stdio: ['ignore', 'pipe', 'ignore'],
            encoding: 'utf8',
        });
        return /ffmpeg/i.test(String(out || ''));
    } catch (_) {
        return false;
    }
};

const systemFfmpeg = () => {
    // 1) Nome assoluto via shell (Termux/Unix): command -v / which
    for (const sh of ['command -v ffmpeg', 'which ffmpeg']) {
        try {
            const out = execFileSync('sh', ['-c', sh], {
                timeout: 5000,
                stdio: ['ignore', 'pipe', 'ignore'],
                encoding: 'utf8',
            });
            const p = String(out || '').trim().split('\n')[0];
            if (p && checkVersion(p)) return p;
        } catch (_) {}
    }
    // 2) Dal PATH: ffmpeg eseguibile trovato per nome
    return checkVersion('ffmpeg') ? 'ffmpeg' : null;
};

function getFfmpegPath() {
    if (tried) return cached;
    tried = true;

    // 1) ffmpeg-static (se installato e funzionante)
    try {
        const staticPath = require('ffmpeg-static');
        if (staticPath && fs.existsSync(staticPath) && checkVersion(staticPath)) {
            cached = staticPath;
            return cached;
        }
    } catch (_) {}

    // 2) ffmpeg di sistema (Termux: pkg install ffmpeg)
    cached = systemFfmpeg() || 'ffmpeg';
    console.log('[ffmpeg-path] risolto:', cached === 'ffmpeg' ? 'ffmpeg (dal PATH, non verificato)' : cached);
    return cached;
}

function resolveFfmpeg(ffmpeg) {
    try {
        ffmpeg.setFfmpegPath(getFfmpegPath());
    } catch (_) {}
}

module.exports = { getFfmpegPath, resolveFfmpeg };