'use strict';

const fs = require('fs/promises');
const path = require('path');
const { searchAudio, getDownloadErrorMessage } = require('../../lib/mediaDownloader');
const { showProgress } = require('../../lib/loading');

module.exports = {
    name: 'mp3',
    aliases: [],
    description: "Scarica e invia l'MP3 intero di una canzone cercandola su YouTube. Uso: .mp3 <titolo> oppure dai 'Scarica MP3' dal comando .cur",

    async run(sock, msg, args, context) {
        const { reply, from } = context;
        const query = (args || []).join(' ').trim();

        if (!query) {
            return reply('Scrivi il titolo della canzone. Esempio: `.mp3 Blinding Lights`');
        }

        let download;
        try {
            const prog = await showProgress(sock, from, {
                label: 'SCARICO MP3',
                duration: 20000,
                steps: 12,
                quoted: msg,
            });

            download = await searchAudio(query);
            const file = await fs.readFile(download.filePath);
            const fileName = path.basename(download.filePath) || 'audio.mp3';

            await sock.sendMessage(from, {
                audio: file,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName,
                caption: `🎵 *${query}*`,
            }, { quoted: msg });

            await prog.done(`🎵 È stata scaricata *${query}* in MP3 intero!`);
        } catch (e) {
            console.error('[mp3]', e.message);
            await reply('❌ ' + getDownloadErrorMessage(e));
        } finally {
            await download?.cleanup();
        }
    },
};