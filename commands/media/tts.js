'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('../../lib/ffmpeg-path').getFfmpegPath();
const googleTTS = require('google-tts-api');
const { showProgress } = require('../../lib/loading');
const { Readable, Writable } = require('stream');

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const toOggOpus = (mp3Buffer) => new Promise((resolve, reject) => {
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
        },
    });

    ffmpeg(Readable.from([mp3Buffer]))
        .inputFormat('mp3')
        .audioCodec('libopus')
        .audioChannels(1)
        .audioFrequency(48000)
        .format('ogg')
        .outputOptions(['-application voip'])
        .on('error', reject)
        .on('end', () => resolve(Buffer.concat(chunks)))
        .pipe(output, { end: true });
});

module.exports = {
    name: 'tts',
    aliases: [],
    description: 'Converte testo in una nota vocale.',

    async run(sock, msg, args) {
        const jid = msg.key.remoteJid;

        try {
            const text = args.join(' ').trim();
            if (!text) throw new Error('Testo mancante');

            const prog = await showProgress(sock, jid, { label: 'SINTESI VOCALE', duration: 3000, quoted: msg });

            const audioParts = await googleTTS.getAllAudioBase64(text, {
                lang: 'it',
                slow: false,
                timeout: 30000,
            });
            const mp3Buffer = Buffer.concat(
                audioParts.map(({ base64 }) => Buffer.from(base64, 'base64'))
            );
            if (mp3Buffer.length === 0) throw new Error('Google TTS non ha generato audio');

            const bufferOggOpus = await toOggOpus(mp3Buffer);
            if (bufferOggOpus.length === 0) throw new Error('Conversione Ogg Opus fallita');

            await sock.sendMessage(
                jid,
                {
                    audio: bufferOggOpus,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                },
                { quoted: msg }
            );
            await prog.done(`${sec('TTS')}\n${boxOpen()}\n${line('_Testo convertito in vocale!_')}\n${boxEnd()}`);
        } catch (error) {
            console.error('[tts]', error.message);
            await sock.sendMessage(jid, { text: "❌ Errore durante l'elaborazione della richiesta." });
        }
    },
};
