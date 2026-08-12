'use strict';

const fs = require('fs/promises');
const { searchAudio, getDownloadErrorMessage } = require('../../lib/mediaDownloader');
const { searchLyrics } = require('../../lib/lyrics');

const MIME_BY_EXT = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    webm: 'audio/webm',
    opus: 'audio/webm',
    ogg: 'audio/ogg',
};

module.exports = {
    name: 'play',
    aliases: ['musica', 'song'],
    description: "Scarica una canzone da YouTube e la invia con il testo (lyrics) e i pulsanti. Uso: .play <titolo>",

    async run(sock, msg, args, context) {
        const { reply, from, services } = context;
        const { sendButtons, axios } = services;

        const query = (args || []).join(' ').trim();
        if (!query) {
            return sendButtons(sock, from,
                "🎵 *Manca la canzone!*\n\nEsempio: `.play Blinding Lights`\n\nIl bot scarica la canzone da YouTube e la invia con il testo.",
                [{ label: '.play Blinding Lights', id: 'play Blinding Lights' }],
                msg);
        }

        await reply(`🎵 Sto cercando *${query}*... (potrebbe volerci qualche secondo)`);

        let download = null;
        try {
            download = await searchAudio(query);
            const file = await fs.readFile(download.filePath);
            if (!file.length) throw new Error('file audio vuoto');

            const ext = download.ext || 'm4a';
            const mimetype = MIME_BY_EXT[ext] || 'audio/mp4';
            const cleanName = query.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 60) || 'song';

            // Invia l'audio come documento (mime audio): è il modo più affidabile
            // per consegnare davvero il file su WhatsApp.
            await sock.sendMessage(from, {
                document: file,
                mimetype,
                fileName: `${cleanName}.${ext}`,
            }, { quoted: msg });

            // Cerca il testo della canzone
            let found = null;
            try {
                found = await searchLyrics(axios, query);
            } catch (e) {
                console.error('[play] lyrics:', e.message);
            }

            const title = found?.title || cleanName;
            const artist = found?.artist || '';

            let msgTxt = `🎵 *${title}*${artist ? ' — _' + artist + '_' : ''}\n\n✅ Canzone inviata!`;

            if (found?.lyrics) {
                const lyrics = found.lyrics.slice(0, 5000) + (found.lyrics.length > 5000 ? '\n\n…testo tagliato qui.' : '');
                await sock.sendMessage(from, { text: `🎤 *Testo di ${title}*\n\n${lyrics}` }, { quoted: msg });
                msgTxt = `🎵 *${title}*${artist ? ' — _' + artist + '_' : ''}\n\n✅ Canzone e testo inviati!`;
            }

            // Pulsanti: scarica di nuovo oppure apri i lyrics
            await sendButtons(sock, from, msgTxt, [
                { label: '🔁 Scarica di nuovo', id: `play ${query}` },
                { label: '🎤 Lyrics', id: `lyrics ${query}` },
            ], msg);
        } catch (e) {
            console.error('[play]', e.message);
            await reply('❌ ' + getDownloadErrorMessage(e));
        } finally {
            await download?.cleanup();
        }
    },
};
