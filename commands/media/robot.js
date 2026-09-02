'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('../../lib/ffmpeg-path').getFfmpegPath();
const { promisify } = require('util');
const execFile = promisify(require('child_process').execFile);
const fs = require('fs');
const path = require('path');
ffmpeg.setFfmpegPath(ffmpegPath);
const TMP_DIR = process.env.TEMP || '/tmp';

module.exports = {
    name: 'robot',
    aliases: ['vocoder', 'robotico', 'metallico'],
    description: 'Effetto voce robotica/vocoder.',

    async run(sock, msg, args, context) {
        const { from, reply, isReply, contextInfo, services } = context;
        const { downloadMediaMessage, showProgress } = services;

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
                    audioBuffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                }
            }
            if (!audioBuffer) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: rispondi a un vocale con *.robot* per voce robotica.')}
${boxEnd()}`);

            const prog = await showProgress(sock, from, { label: 'VOCE ROBOTICA', duration: 2500, quoted: msg });
            const inputPath = path.join(TMP_DIR, `robot_in_${Date.now()}.opus`);
            const outputPath = path.join(TMP_DIR, `robot_out_${Date.now()}.opus`);
            fs.writeFileSync(inputPath, audioBuffer);
            await execFile(ffmpegPath, ['-y', '-i', inputPath, '-af', 'asetrate=48000*0.6,aresample=48000,volume=2.0,chorus=0.5:0.9:50:0.7:0.7:2', '-c:a', 'libopus', '-b:a', '64k', outputPath]);
            const result = fs.readFileSync(outputPath);
            await sock.sendMessage(from, { audio: result, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
            await prog.done(`${sec('ROBOT')}\n${boxOpen()}\n${line('_Voce robotica pronta!_')}\n${boxEnd()}`);
            fs.unlinkSync(inputPath); fs.unlinkSync(outputPath);
        } catch (e) {
            console.error('[robot]', e);
            reply('❌ Errore durante la creazione dell\'effetto.');
        }
    },
};