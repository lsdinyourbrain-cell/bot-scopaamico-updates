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
    name: 'reverse',
    aliases: ['inverti', 'backwards', 'alcontrario'],
    description: 'Inverte il vocale (si sente al contrario).',

    async run(sock, msg, args, context) {
        const { from, reply, isReply, contextInfo, services } = context;
        const { downloadMediaMessage } = services;

        try {
            let audioBuffer = null;
            if (isReply && contextInfo.quotedMessage) {
                const quoted = contextInfo.quotedMessage;
                const audioMsg = quoted.audioMessage || quoted.ephemeralMessage?.message?.audioMessage;
                if (audioMsg) {
                    const quotedMsg = {
                        key: { id: contextInfo.stanzaId, remoteJid: from, fromMe: contextInfo.participant === (sock.user?.id || ''), participant: contextInfo.participant },
                        message: { audioMessage: audioMsg }
                    };
                    audioBuffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, { reissueRequest: sock.updateMediaMessage });
                }
            }
            if (!audioBuffer) return reply('🎤 Rispondi a un vocale con *.reverse* per invertirlo.');

            await reply('⏪ *Invertendo audio...*');
            const inputPath = path.join(TMP_DIR, `rev_in_${Date.now()}.opus`);
            const outputPath = path.join(TMP_DIR, `rev_out_${Date.now()}.opus`);
            fs.writeFileSync(inputPath, audioBuffer);
            await execFile(ffmpegPath, ['-y', '-i', inputPath, '-af', 'areverse', '-c:a', 'libopus', '-b:a', '64k', outputPath]);
            const result = fs.readFileSync(outputPath);
            await sock.sendMessage(from, { audio: result, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
            fs.unlinkSync(inputPath); fs.unlinkSync(outputPath);
        } catch (e) {
            console.error('[reverse]', e);
            reply('❌ Errore durante la creazione dell\'effetto.');
        }
    },
};