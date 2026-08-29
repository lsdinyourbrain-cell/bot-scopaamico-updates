'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

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
                { video, caption: '✅ *_DOWNLOAD_*\n━━━━━━━━━━━━━━\n▸ _Download completato!_\n' },
                { quoted: msg }
            );
            await prog.done('📥 *_INSTAGRAM_*\n━━━━━━━━━━━━━━\n▸ _Video Instagram scaricato!_\n');
        } catch (error) {
            console.error('[ig]', error.message);
            await sock.sendMessage(jid, { text: "❌ Link non valido o download non disponibile." });
        } finally {
            await download?.cleanup();
        }
    },
};
