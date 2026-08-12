'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const { getFfmpegPath } = require('./ffmpeg-path');
const ffmpegPath = getFfmpegPath();

// Su Android (Termux) il binario yt-dlp bundleato in youtube-dl-exec è spesso
// vecchio o non eseguibile: preferiamo SEMPRE l'yt-dlp di sistema installato
// con "pkg install yt-dlp". Il bundle resta il fallback sugli altri sistemi.
const isAndroid = process.platform === 'linux' && typeof process.env.ANDROID_ROOT === 'string';

// Termux: usa yt-dlp di sistema se il binario bundleato non funziona
let youtubeDlExec;
try {
    youtubeDlExec = require('youtube-dl-exec');
} catch (_) {
    youtubeDlExec = null;
}

let youtubeDl;
let YOUTUBE_DL_DIRECTORY;
let YOUTUBE_DL_OPTIONS = {};

if (youtubeDlExec && youtubeDlExec.constants?.YOUTUBE_DL_PATH && !isAndroid) {
    const bundledPath = youtubeDlExec.constants.YOUTUBE_DL_PATH;
    const fs_ = require('fs');
    if (fs_.existsSync(bundledPath)) {
        YOUTUBE_DL_DIRECTORY = path.dirname(bundledPath);
        youtubeDl = youtubeDlExec.create(path.basename(bundledPath));
        YOUTUBE_DL_OPTIONS = { cwd: YOUTUBE_DL_DIRECTORY };
    }
}

if (!youtubeDl && youtubeDlExec) {
    // Fallback: yt-dlp di sistema (Termux: pkg install yt-dlp oppure pip install yt-dlp)
    try {
        youtubeDl = youtubeDlExec.create('yt-dlp');
        YOUTUBE_DL_OPTIONS = {};
    } catch (_) {
        youtubeDl = null;
    }
}

const DEFAULT_COOKIES_FILE = path.join(__dirname, '..', 'youtube-cookies.txt');
const TEMP_DIRECTORY = path.join(__dirname, '..', 'temp');
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm', '.mov']);
const CONFIGURED_COOKIES_FILE = process.env.YTDLP_COOKIES_FILE?.trim();
const COOKIES_FILE = CONFIGURED_COOKIES_FILE || DEFAULT_COOKIES_FILE;

const assertHttpUrl = (value) => {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('L\'URL deve usare HTTP o HTTPS');
    }
    return url.toString();
};

const getCookieFlags = async () => {
    try {
        // Un file Netscape esportato dal proprietario è portabile anche sul
        // server e non richiede l'accesso al database del browser.
        const cookieFile = path.resolve(COOKIES_FILE);
        await fs.access(cookieFile);
        return { cookies: cookieFile };
    } catch (error) {
        // Una variabile impostata con un percorso errato è un errore di
        // configurazione; il percorso predefinito mancante resta opzionale.
        if (CONFIGURED_COOKIES_FILE) {
            throw new Error('Il file dei cookie di YouTube configurato non è leggibile');
        }
        return {};
    }
};

const getDownloadErrorMessage = (error) => {
    const details = String(error?.message || '');
    if (details === 'YTDLP_MANCANTE' || /yt-dlp non è installato/i.test(details)) {
        return '⚠️ yt-dlp non è disponibile. Su Termux esegui: pkg install yt-dlp (poi riparti il bot).';
    }
    const protectedVideo = /sign in to confirm|cookies|private video|members-only|age-restricted|video is unavailable/i;
    const unavailableFormat = /requested format is not available/i;

    if (protectedVideo.test(details)) {
        return '⚠️ Video protetto o non scaricabile. Verifica che youtube-cookies.txt sia valido e aggiornato.';
    }
    if (unavailableFormat.test(details)) {
        return '⚠️ Nessun formato compatibile è disponibile per questo video.';
    }
    if (/ffmpeg|ffprobe|postprocessing/i.test(details)) {
        return '⚠️ Manca ffmpeg per convertire l\'audio. Su Termux esegui: pkg install ffmpeg (poi riparti il bot).';
    }
    if (/unable to extract|wrong url|url isn't valid|ytsearch/i.test(details)) {
        return '⭐ Canzone non trovata. Prova a scrivere meglio il titolo e l\'artista.';
    }
    return '❌ Link non valido o download non disponibile. ' + details.slice(0, 150);
};

const runYoutubeDl = async (url, flags) => {
    if (!youtubeDl) {
        throw new Error('yt-dlp non è installato. Su Termux esegui: pkg install yt-dlp');
    }
    try {
        return await youtubeDl(url, flags, YOUTUBE_DL_OPTIONS);
    } catch (error) {
        const formatUnavailable = /requested format is not available/i.test(String(error?.message || ''));

        // Alcuni cookie esportati fanno sì che YouTube non restituisca alcun
        // formato. Per i contenuti pubblici la richiesta anonima è valida e
        // consente di usare il fallback di formato senza bloccare il comando.
        if (flags.cookies && formatUnavailable) {
            const { cookies, ...anonymousFlags } = flags;
            console.warn('[yt-dlp] Formati non disponibili con i cookie: nuovo tentativo senza cookie.');
            return youtubeDl(url, anonymousFlags, YOUTUBE_DL_OPTIONS);
        }

        throw error;
    }
};

const removeTemporaryFiles = async (prefix) => {
    try {
        const files = await fs.readdir(TEMP_DIRECTORY);
        await Promise.all(
            files
                .filter(file => file.startsWith(prefix))
                .map(file => fs.unlink(path.join(TEMP_DIRECTORY, file)).catch(() => {}))
        );
    } catch (_) {
        // La pulizia non deve mai impedire la risposta del comando.
    }
};

const findDownloadedFile = async (prefix, extensions) => {
    const files = await fs.readdir(TEMP_DIRECTORY);
    const candidates = [];

    for (const file of files) {
        if (!file.startsWith(prefix)) continue;

        const filePath = path.join(TEMP_DIRECTORY, file);
        const extension = path.extname(file).toLowerCase();
        if (!extensions.has(extension)) continue;

        const info = await fs.stat(filePath);
        if (info.isFile() && info.size > 0) candidates.push({ filePath, size: info.size });
    }

    candidates.sort((first, second) => second.size - first.size);
    if (!candidates[0]) throw new Error('yt-dlp non ha prodotto un file utilizzabile');
    return candidates[0].filePath;
};

// CERCA video su YouTube senza scaricarli. Usa la modalità "flat playlist"
// (solo metadati, veloce) su "ytsearchN:query": ritorna una lista di video
// con titolo, durata, canale e URL. Ritorna un array di risultati.
const searchVideos = async (query, limit = 6) => {
    await fs.mkdir(TEMP_DIRECTORY, { recursive: true });
    if (!youtubeDl) throw new Error('YTDLP_MANCANTE');

    const prefix = `search-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const flags = {
        dumpJson: true,
        flatPlaylist: true,
        quiet: true,
        noWarnings: true,
        noPlaylist: true,
        playlistStart: 1,
        playlistEnd: limit,
    };
    Object.assign(flags, await getCookieFlags());

    try {
        const proc = youtubeDl.exec(`ytsearch${limit}:${query}`, flags, YOUTUBE_DL_OPTIONS);
        const { stdout } = await proc;
        const results = stdout
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('{'))
            .map(line => { try { return JSON.parse(line); } catch (_) { return null; } })
            .filter(Boolean)
            .filter(v => v && v.url && (v.title || v.id))
            .map(v => ({
                id: v.id || v.display_id || '',
                title: (v.title || 'Video').slice(0, 120),
                duration: v.duration || 0,
                channel: v.channel || v.uploader || '',
                views: v.view_count || 0,
                url: v.url || v.webpage_url || '',
                thumbnail: v.thumbnails?.[(v.thumbnails?.length || 0) - 1]?.url || v.thumbnail || (v.id ? `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` : ''),
            }))
            .slice(0, limit);

        if (!results.length) throw new Error('NESSUN_RISULTATO');
        return results;
    } finally {
        await removeTemporaryFiles(prefix).catch(() => {});
    }
};

// Cerca una canzone su YouTube ("ytsearch1:<query>") e scarica l'audio
// completo. Prova prima l'MP3 (richiede ffmpeg); se la conversione fallisce
// perché manca ffmpeg, scarica l'audio originale (m4a/webm) senza conversioni.
// Ritorna { filePath, ext, cleanup }.
const searchAudio = async (query) => {
    await fs.mkdir(TEMP_DIRECTORY, { recursive: true });

    if (!youtubeDl) {
        throw new Error('YTDLP_MANCANTE');
    }

    const prefix = `audio-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const output = path.join(TEMP_DIRECTORY, `${prefix}.%(ext)s`);
    const commonFlags = {
        noPlaylist: true,
        noWarnings: true,
        quiet: true,
        output,
        ffmpegLocation: ffmpegPath,
        windowsFilenames: true,
    };

    Object.assign(commonFlags, await getCookieFlags());

    try {
        // 1) MP3 intero (serve ffmpeg per la conversione)
        try {
            await runYoutubeDl(
                `ytsearch1:${query}`,
                {
                    ...commonFlags,
                    format: 'bestaudio/best',
                    extractAudio: true,
                    audioFormat: 'mp3',
                    audioQuality: '192K',
                }
            );
            const filePath = await findDownloadedFile(prefix, new Set(['.mp3']));
            return {
                filePath,
                ext: 'mp3',
                cleanup: () => removeTemporaryFiles(prefix),
            };
        } catch (e) {
            const noFfmpeg = /ffmpeg|ffprobe|postprocessing/i.test(String(e?.message || ''));
            if (!noFfmpeg) throw e;
            console.warn('[searchAudio] ffmpeg non trovato, scarico audio originale (m4a).');
        }

        // 2) Fallback: audio originale senza conversioni (non serve ffmpeg)
        await runYoutubeDl(
            `ytsearch1:${query}`,
            {
                ...commonFlags,
                format: 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
            }
        );

        const filePath = await findDownloadedFile(prefix, new Set(['.m4a', '.webm', '.opus', '.ogg']));
        return {
            filePath,
            ext: path.extname(filePath).toLowerCase().replace('.', '') || 'm4a',
            cleanup: () => removeTemporaryFiles(prefix),
        };
    } catch (error) {
        await removeTemporaryFiles(prefix);
        throw error;
    }
};

// Converte qualsiasi video in .mp4 (WhatsApp apre male .webm/.mkv inviati
// come video). Prima prova la remux veloce (-c copy, stessa qualità); se i
// codec non sono compatibili col contenitore mp4 (es. vp9/opus) ri-encoda
// con h264+aac. Ritorna il percorso del nuovo file .mp4.
const toMp4 = async (filePath) => {
    const out = String(filePath).replace(/(\.[^.]+)$/, '') + '-conv.mp4';
    try {
        await execFileAsync(ffmpegPath, ['-y', '-i', filePath, '-c', 'copy', out], { timeout: 120000 });
    } catch (_) {
        try {
            await execFileAsync(
                ffmpegPath,
                ['-y', '-i', filePath, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', out],
                { timeout: 600000 }
            );
        } catch (e) {
            await fs.unlink(out).catch(() => {});
            throw new Error('Conversione video in mp4 fallita: ' + e.message);
        }
    }
    await fs.unlink(filePath).catch(() => {});
    return out;
};

// Formato di download video con qualità (altezza) richiesta. Con mergebot
// sempre in .mp4: video+audio fusi in un unico file leggibile ovunque.
const videoFormat = (maxHeight) => {
    if (maxHeight > 0) {
        return `bestvideo[height<=${maxHeight}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${maxHeight}]+bestaudio/best[height<=${maxHeight}]`;
    }
    return 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/bestvideo+bestaudio/best';
};

const download = async (url, type, opts = {}) => {
    await fs.mkdir(TEMP_DIRECTORY, { recursive: true });

    const prefix = `${type}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const output = path.join(TEMP_DIRECTORY, `${prefix}.%(ext)s`);
    const commonFlags = {
        noPlaylist: true,
        noWarnings: true,
        quiet: true,
        output,
        ffmpegLocation: ffmpegPath,
        windowsFilenames: true,
    };

    Object.assign(commonFlags, await getCookieFlags());

    try {
        if (type === 'audio') {
            const videoUrl = assertHttpUrl(url);

            // 1) Prova l'MP3 (serve ffmpeg per la conversione). Se la
            //    conversione fallisce per un problema con ffmpeg, NON
            //    blocchiamo il download: ripieghiamo sull'audio originale.
            try {
                await runYoutubeDl(
                    videoUrl,
                    {
                        ...commonFlags,
                        format: 'bestaudio/best',
                        extractAudio: true,
                        audioFormat: 'mp3',
                        audioQuality: '192K',
                    }
                );
                return {
                    filePath: await findDownloadedFile(prefix, new Set(['.mp3'])),
                    ext: 'mp3',
                    cleanup: () => removeTemporaryFiles(prefix),
                };
            } catch (e) {
                const noFfmpeg = /ffmpeg|ffprobe|postprocessing/i.test(String(e?.message || ''));
                if (!noFfmpeg) throw e;
                console.warn('[download] conversione mp3 fallita (' + e.message + '): scarico l\'audio originale (m4a).');
            }

            // 2) Fallback: audio originale senza conversioni (non serve ffmpeg)
            await runYoutubeDl(
                videoUrl,
                {
                    ...commonFlags,
                    format: 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
                }
            );

            const filePath = await findDownloadedFile(prefix, new Set(['.m4a', '.webm', '.opus', '.ogg']));
            return {
                filePath,
                ext: path.extname(filePath).toLowerCase().replace('.', '') || 'm4a',
                cleanup: () => removeTemporaryFiles(prefix),
            };
        }

        const videoUrl = assertHttpUrl(url);
        await runYoutubeDl(
            videoUrl,
            {
                ...commonFlags,
                format: videoFormat(opts.height),
                mergeOutputFormat: 'mp4',
            }
        );

        let filePath = await findDownloadedFile(prefix, VIDEO_EXTENSIONS);
        // WhatsApp non apre .webm/.mkv come video: garantiamo sempre .mp4.
        if (path.extname(filePath).toLowerCase() !== '.mp4') {
            filePath = await toMp4(filePath);
        }

        return {
            filePath,
            ext: 'mp4',
            cleanup: () => removeTemporaryFiles(prefix),
        };
    } catch (error) {
        await removeTemporaryFiles(prefix);
        throw error;
    }
};

module.exports = {
    downloadAudio: (url) => download(url, 'audio'),
    downloadVideo: (url, opts) => download(url, 'video', opts || {}),
    searchAudio,
    searchVideos,
    getDownloadErrorMessage,
};
