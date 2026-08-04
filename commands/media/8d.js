'use strict';

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('../../lib/ffmpeg-path').getFfmpegPath();
const { promisify } = require('util');
const execFile = promisify(require('child_process').execFile);
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);
const TMP_DIR = process.env.TEMP || '/tmp';

module.exports = {
    name: '8d',
    aliases: ['8daudio', 'spaziale', 'surround'],
    description: 'Effetto 8D Audio (spaziale) - funziona meglio con le cuffie.',

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, reply, targetJid, isReply, contextInfo, textArgs, services } = context;
        const { downloadMediaMessage } = services;

        try {
            let audioBuffer = null;

            if (isReply && contextInfo.quotedMessage) {
                const quoted = contextInfo.quotedMessage;
                const audioMsg = quoted.audioMessage || quoted.ephemeralMessage?.message?.audioMessage;
                if (audioMsg) {
                    const quotedMsg = {
                        key: {
                            id: contextInfo.stanzaId,
                            remoteJid: from,
                            fromMe: contextInfo.participant === (sock.user?.id || ''),
                            participant: contextInfo.participant
                        },
                        message: { audioMessage: audioMsg }
                    };
                    audioBuffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, { reissueRequest: sock.updateMediaMessage });
                }
            }

            if (!audioBuffer) {
                return reply('🎤 Rispondi a un vocale con *.8d* per audio spaziale 8D. Usa le cuffie!');
            }

            await reply('🎧 *Generando 8D Audio... Indossa le cuffie!*');

            const inputPath = path.join(TMP_DIR, `8d_input_${Date.now()}.opus`);
            const outputPath = path.join(TMP_DIR, `8d_output_${Date.now()}.opus`);

            fs.writeFileSync(inputPath, audioBuffer);

            await execFile(ffmpegPath, [
                '-y',
                '-i', inputPath,
                '-af', 'aformat=channel_layouts=stereo,apulsator=hz=0.08:amount=1:width=1,aecho=0.8:0.9:100:0.3',
                '-c:a', 'libopus',
                '-b:a', '64k',
                outputPath
            ]);

            const resultBuffer = fs.readFileSync(outputPath);

            await sock.sendMessage(from, {
                audio: resultBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: msg });

            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

        } catch (e) {
            console.error('[8d]', e);
            await reply('❌ Errore durante la creazione dell\'effetto 8D.');
        }
    },
};