'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { getFfmpegPath } = require('./ffmpeg-path');
const ffmpegPath = getFfmpegPath();

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

if (youtubeDlExec && youtubeDlExec.constants?.YOUTUBE_DL_PATH) {
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
    const protectedVideo = /sign in to confirm|cookies|private video|members-only|age-restricted|video is unavailable/i;
    const unavailableFormat = /requested format is not available/i;

    if (protectedVideo.test(details)) {
        return '⚠️ Video protetto o non scaricabile. Verifica che youtube-cookies.txt sia valido e aggiornato.';
    }
    if (unavailableFormat.test(details)) {
        return '⚠️ Nessun formato compatibile è disponibile per questo video.';
    }
    return '❌ Link non valido o download non disponibile.';
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

// Cerca una canzone su YouTube ("ytsearch1:<query>") e scarica l'audio
// completo in MP3. Ritorna { filePath, cleanup } come download().
const searchAudio = async (query) => {
    await fs.mkdir(TEMP_DIRECTORY, { recursive: true });

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

        return {
            filePath: await findDownloadedFile(prefix, new Set(['.mp3'])),
            cleanup: () => removeTemporaryFiles(prefix),
        };
    } catch (error) {
        await removeTemporaryFiles(prefix);
        throw error;
    }
};

const download = async (url, type) => {
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
            await runYoutubeDl(
                assertHttpUrl(url),
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
                cleanup: () => removeTemporaryFiles(prefix),
            };
        }

        await runYoutubeDl(
            assertHttpUrl(url),
            {
                ...commonFlags,
                format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                mergeOutputFormat: 'mp4',
            }
        );

        return {
            filePath: await findDownloadedFile(prefix, VIDEO_EXTENSIONS),
            cleanup: () => removeTemporaryFiles(prefix),
        };
    } catch (error) {
        await removeTemporaryFiles(prefix);
        throw error;
    }
};

module.exports = {
    downloadAudio: (url) => download(url, 'audio'),
    downloadVideo: (url) => download(url, 'video'),
    searchAudio,
    getDownloadErrorMessage,
};
