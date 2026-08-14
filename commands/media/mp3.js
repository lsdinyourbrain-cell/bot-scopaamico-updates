'use strict';

const fs = require('fs/promises');
const { searchAudio, getDownloadErrorMessage } = require('../../lib/mediaDownloader');
const { showProgress } = require('../../lib/loading');

const MIME_BY_EXT = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    webm: 'audio/webm',
    opus: 'audio/webm',
    ogg: 'audio/ogg',
};

module.exports = {
    name: 'mp3',
    aliases: [],
    description: "Scarica e invia l'audio intero di una canzone cercandola su YouTube. Uso: .mp3 <titolo>",

    async run(sock, msg, args, context) {
        const { reply, from } = context;
        const query = (args || []).join(' ').trim();

        if (!query) {
            return reply("⚠️ _[uso]: scrivi il titolo della canzone._\n━━━━━━━━━━━━━━\n▸ Esempio: `.mp3 Blinding Lights`");
        }

        const prog = await showProgress(sock, from, {
            label: 'SCARICO AUDIO',
            duration: 20000,
            steps: 12,
            quoted: msg,
        });

        let download = null;
        try {
            download = await searchAudio(query);
            const file = await fs.readFile(download.filePath);
            if (!file.length) throw new Error('file audio vuoto');

            const ext = download.ext || 'm4a';
            const mimetype = MIME_BY_EXT[ext] || 'audio/mp4';
            const cleanName = query.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 60) || 'song';

            // Invia come DOCUMENT con mime audio: è il modo più affidabile per
            // consegnare davvero il file (l'invio come bolla audio con
            // ptt:false a volte viene scartato in silenzio da WhatsApp).
            await sock.sendMessage(from, {
                document: file,
                mimetype,
                fileName: `${cleanName}.${ext}`,
            }, { quoted: msg });

            await prog.done(`🎵 *_MP3_*\n━━━━━━━━━━━━━━\n▸ _Scaricato_ *${query}* _intero!_\n◈ _Vex Bot_`);
        } catch (e) {
            console.error('[mp3]', e.message);
            await prog.fail('❌ ' + getDownloadErrorMessage(e));
        } finally {
            await download?.cleanup();
        }
    },
};