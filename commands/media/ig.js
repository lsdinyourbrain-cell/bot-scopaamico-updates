'use strict';

const fs = require('fs/promises');
const { downloadVideo } = require('../../lib/mediaDownloader');
const { showProgress } = require('../../lib/loading');

module.exports = {
    name: 'ig',
    aliases: [],
    description: 'Scarica un video Instagram.',

    async run(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let download;

        try {
            const url = args.join(' ').trim();
            if (!url) throw new Error('URL mancante');

            const prog = await showProgress(sock, jid, { label: 'DOWNLOAD INSTAGRAM', duration: 8000, quoted: msg });

            download = await downloadVideo(url);
            const video = await fs.readFile(download.filePath);

            await sock.sendMessage(
                jid,
                { video, caption: '✅ Download completato!' },
                { quoted: msg }
            );
            await prog.done('📥 *Video Instagram scaricato!* ✅');
        } catch (error) {
            console.error('[ig]', error.message);
            await sock.sendMessage(jid, { text: "❌ Link non valido o download non disponibile." });
        } finally {
            await download?.cleanup();
        }
    },
};
