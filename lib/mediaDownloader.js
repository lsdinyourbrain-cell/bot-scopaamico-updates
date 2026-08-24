'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const { getFfmpegPath, isFfmpegVerified } = require('./ffmpeg-path');
const ffmpegPath = getFfmpegPath();
const ffmpegOk = isFfmpegVerified();

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
// Percorso del binario usato per l'auto-aggiornamento ("-U"): di default il
// comando di sistema, altrimenti il binario bundleato di youtube-dl-exec.
let YOUTUBE_DL_BINARY = 'yt-dlp';

if (youtubeDlExec && youtubeDlExec.constants?.YOUTUBE_DL_PATH && !isAndroid) {
    const bundledPath = youtubeDlExec.constants.YOUTUBE_DL_PATH;
    const fs_ = require('fs');
    if (fs_.existsSync(bundledPath)) {
        YOUTUBE_DL_DIRECTORY = path.dirname(bundledPath);
        YOUTUBE_DL_BINARY = bundledPath;
        youtubeDl = youtubeDlExec.create(path.basename(bundledPath));
        YOUTUBE_DL_OPTIONS = { cwd: YOUTUBE_DL_DIRECTORY };
    }
}

if (!youtubeDl && youtubeDlExec) {
    // Fallback: yt-dlp di sistema (Termux: pkg install yt-dlp oppure pip install yt-dlp)
    try {
        youtubeDl = youtubeDlExec.create('yt-dlp');
        YOUTUBE_DL_BINARY = 'yt-dlp';
        YOUTUBE_DL_OPTIONS = {};
    } catch (_) {
        youtubeDl = null;
    }
}

// ── AUTO-AGGIORNAMENTO yt-dlp ─────────────────────────────────────────────
// YouTube cambia spesso i meccanismi anti-bot: con un yt-dlp vecchio di mesi
// i download falliscono con "http error 403 forbidden" mentre la ricerca
// (solo metadati) continua a funzionare. Qui proviamo ad aggiornare il
// binario da soli ("-U"), senza far crashare nulla se non ci riesce.
const UPDATE_INTERVAL_MS = 12 * 60 * 60 * 1000; // max un aggiornamento ogni 12h
let lastUpdateAttempt = 0;
let updateInFlight = null;

const updateYtDlp = async (force) => {
    if (force) {
        // Aggiornamento forzato: aspetta l'eventuale tentativo in corso.
        if (updateInFlight) return updateInFlight;
    } else if (Date.now() - lastUpdateAttempt < UPDATE_INTERVAL_MS) {
        return null; // troppo presto per riprovare
    }

    lastUpdateAttempt = Date.now();
    updateInFlight = (async () => {
        try {
            await execFileAsync(YOUTUBE_DL_BINARY, ['-U'], { timeout: 90000 });
            console.log('[yt-dlp] aggiornamento completato.');
        } catch (e) {
            // Permessi o installazione read-only: l'update non è obbligatorio.
            console.warn('[yt-dlp] auto-aggiornamento non riuscito:', (e.message || '').slice(0, 80));
        } finally {
            updateInFlight = null;
        }
    })();
    return updateInFlight;
};

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
        const cookieFile = path.resolve(COOKIES_FILE);
        await fs.access(cookieFile);
        return { cookies: cookieFile };
    } catch (error) {
        if (CONFIGURED_COOKIES_FILE) {
            throw new Error('Il file dei cookie di YouTube configurato non è leggibile');
        }
        return {};
    }
};

// Client Android bypassa gran parte dei blocchi anti-bot senza cookie
const ANDROID_ARGS = 'youtube:player_client=android';

const getDownloadErrorMessage = (error) => {
    const details = String(error?.message || '');
    if (details === 'YTDLP_MANCANTE' || /yt-dlp non è installato/i.test(details)) {
        return '⚠️ yt-dlp non è disponibile. Su Termux esegui: pkg install yt-dlp (poi riparti il bot).';
    }
    if (/il file dei cookie di youtube configurato non è leggibile/i.test(details)) {
        return '⚠️ Il percorso dei cookie configurato non è\nvalido. Verifica `YTDLP_COOKIES_FILE` nel\nfile di avvio del bot oppure rimuovilo.';
    }
    const unavailableFormat = /requested format is not available/i;

    if (/http error 403|403 forbidden|forbidden/i.test(details)) {
        return '⚠️ YouTube ha bloccato il download (errore 403). Ho aggiornato\nyt-dlp e ritentato: se persiste, aggiorna\n`youtube-cookies.txt` (esporta i cookie dal\nbrowser) oppure riprova tra qualche minuto.';
    }
    // Video rimossi/privati/con restrizioni: il video esiste ma non è scaricabile.
    const restrictedVideo = /private video|members-only|members only|age-restricted|age restricted|video is unavailable|video unavailable|is unavailable|has been removed|removed by|deleted by|only available to members|available only to members/i;
    if (restrictedVideo.test(details)) {
        return '⚠️ Video protetto o non scaricabile. Verifica che youtube-cookies.txt sia valido e aggiornato.';
    }
    // Controlli anti-bot di YouTube (2025-2026): login richiesto, PO token,
    // SABR, nsig/throttling, cookie scaduti. Soluzione: riesportare i cookie.
    const botCheck = /sign in to confirm|you'?re not a bot|not a bot|po token|po-token|sabr|throttl|nsig|re-export|re-extract|cookie|cookies|authenticat|logged in|logged-in|signed in|signed-in|player client|player_client|expired|confirm your age|confirm.*human/i;
    if (botCheck.test(details)) {
        return '⚠️ YouTube ha rilevato traffico automatico.\nRiesporta i cookie in `youtube-cookies.txt`\n(dal browser loggato su YouTube) e riprova.\nSe non risolvi, aggiorna yt-dlp con\n`yt-dlp -U` (Termux) e riparti il bot.';
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
    return '❌ Link non valido o download non disponibile. ' + details.slice(0, 200);
};

const runYoutubeDl = async (url, flags) => {
    if (!youtubeDl) {
        throw new Error('yt-dlp non è installato. Su Termux esegui: pkg install yt-dlp');
    }
    try {
        return await youtubeDl(url, flags, YOUTUBE_DL_OPTIONS);
    } catch (error) {
        const message = String(error?.message || '');
        const formatUnavailable = /requested format is not available/i.test(message);

        // Alcuni cookie esportati fanno sì che YouTube non restituisca alcun
        // formato. Per i contenuti pubblici la richiesta anonima è valida e
        // consente di usare il fallback di formato senza bloccare il comando.
        if (flags.cookies && formatUnavailable) {
            const { cookies, ...anonymousFlags } = flags;
            console.warn('[yt-dlp] Formati non disponibili con i cookie: nuovo tentativo senza cookie.');
            return youtubeDl(url, anonymousFlags, YOUTUBE_DL_OPTIONS);
        }

        // "http error 403 forbidden" = YouTube ha bloccato il download, di
        // solito per un yt-dlp datato (i metodi anti-bot cambiano in
        // continuazione). Anche "sign in to confirm / po token / nsig / sabr"
        // sono segnali di estrazione datata: aggiorniamo il binario e
        // ritentiamo UNA volta. Se il problema era la versione, il secondo
        // giro va a buon fine.
        const versionRelated = /http error 403|403 forbidden|forbidden|sign in to confirm|not a bot|po token|sabr|nsig|throttl|re-export|signed in|logged in|player client/i.test(message);
        if (versionRelated) {
            console.warn('[yt-dlp] estrazione datata (' + message.slice(0, 60) + '): aggiorno yt-dlp e ritento il download.');
            try {
                await updateYtDlp(true);
            } catch (_) {}
            return youtubeDl(url, flags, YOUTUBE_DL_OPTIONS);
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
        extractorArgs: ANDROID_ARGS,
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
    try { await updateYtDlp(false); } catch (_) {}

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
        extractorArgs: ANDROID_ARGS,
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

// Nome del binario ffprobe: sta nella stessa cartella di ffmpeg.
const ffprobePath = /[\\/]/.test(String(ffmpegPath)) && !ffmpegPath.includes('ffmpeg-static')
    ? ffmpegPath.replace(/[\\/]ffmpeg$/, path.sep + 'ffprobe')
    : 'ffprobe';

// Codec video del file (es. h264, hevc, vp9). WhatsApp NON apre hevc/h265
// nel messaggio video: va ri-encodato in h264.
const probeVideoCodec = async (filePath) => {
    try {
        const { stdout } = await execFileAsync(
            ffprobePath,
            ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', filePath],
            { timeout: 30000 }
        );
        return String(stdout || '').trim().split('\n')[0].trim();
    } catch (_) {
        return '';
    }
};

// Converte qualsiasi video in .mp4 compatibile con WhatsApp (h264+aac):
//  - già h264 → rimux veloce nel contenitore mp4 (-c copy, stessa qualità);
//  - h265/vp9/altro → ri-encode in h264 con libx264.
// Ritorna il percorso del nuovo file .mp4.
const toMp4 = async (filePath) => {
    const out = String(filePath).replace(/(\.[^.]+)$/, '') + '-conv.mp4';
    const codec = await probeVideoCodec(filePath);
    let needReencode = codec && !['h264', 'avc1', 'mpeg4'].includes(codec);

    if (!needReencode) {
        // Già h264: basta il contenitore giusto. Remux veloce e basta.
        if (path.extname(filePath).toLowerCase() === '.mp4') return filePath;
        try {
            await execFileAsync(ffmpegPath, ['-y', '-i', filePath, '-c', 'copy', out], { timeout: 120000 });
        } catch (_) {
            needReencode = true;
        }
    }

    if (needReencode) {
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
// Se ffmpeg NON funziona, si scarica un singolo file già pronto (niente
// merge): di solito è mp4 + codec h264 e WhatsApp lo apre direttamente.
const videoFormat = (maxHeight) => {
    if (ffmpegOk && maxHeight > 0) {
        return `bestvideo[height<=${maxHeight}][ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=${maxHeight}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${maxHeight}][ext=mp4]/best[height<=${maxHeight}]`;
    }
    if (ffmpegOk) {
        return 'bestvideo[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    }
    if (maxHeight > 0) {
        return `best[height<=${maxHeight}][ext=mp4]/best[ext=mp4]/best`;
    }
    return 'best[ext=mp4]/best';
};

const download = async (url, type, opts = {}) => {
    await fs.mkdir(TEMP_DIRECTORY, { recursive: true });
    // Prima di scaricare teniamo yt-dlp aggiornato (throttled: max 1/12h):
    // i download falliscono con 403 quando la versione è datata.
    try { await updateYtDlp(false); } catch (_) {}

    const prefix = `${type}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const output = path.join(TEMP_DIRECTORY, `${prefix}.%(ext)s`);
    const commonFlags = {
        noPlaylist: true,
        noWarnings: true,
        quiet: true,
        output,
        ffmpegLocation: ffmpegPath,
        windowsFilenames: true,
        extractorArgs: ANDROID_ARGS,
    };

    Object.assign(commonFlags, await getCookieFlags());

    try {
        if (type === 'audio') {
            const videoUrl = assertHttpUrl(url);

            // 1) Prova l'MP3 (serve ffmpeg per la conversione). Se ffmpeg non
            //    funziona o la conversione fallisce, NON blocchiamo il
            //    download: ripieghiamo sull'audio originale.
            if (ffmpegOk) {
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
            } else {
                console.warn('[download] ffmpeg non verificato: salto la conversione mp3 e scarico l\'audio originale.');
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
                ...(ffmpegOk ? { mergeOutputFormat: 'mp4' } : {}),
            }
        );

        let filePath = await findDownloadedFile(prefix, VIDEO_EXTENSIONS);
        const ext = path.extname(filePath).toLowerCase();

        if (ffmpegOk) {
            // WhatsApp apre male .webm/.mkv e NON apre h265: toMp4 decide se
            // serve il rimux (già h264) o il ri-encode (h265/vp9) in .mp4.
            if (ext !== '.mp4') filePath = await toMp4(filePath);
        } else if (ext !== '.mp4') {
            throw new Error('Il video scaricato è ' + ext + ' e ffmpeg non funziona su questo dispositivo, quindi non posso convertirlo in mp4. Su Termux esegui: pkg upgrade -y && pkg reinstall ffmpeg (poi riparti il bot).');
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
