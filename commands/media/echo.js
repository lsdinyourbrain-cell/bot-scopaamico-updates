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
    name: 'echo',
    aliases: ['riverbero', 'reverb', 'caverna'],
    description: 'Aggiunge eco/riverbero al vocale.',

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
${line('[uso]: rispondi a un vocale con *.echo* per aggiungere riverbero.')}
${boxEnd()}`);

            const prog = await showProgress(sock, from, { label: 'RIVERBERO', duration: 2500, quoted: msg });
            const inputPath = path.join(TMP_DIR, `echo_in_${Date.now()}.opus`);
            const outputPath = path.join(TMP_DIR, `echo_out_${Date.now()}.opus`);
            fs.writeFileSync(inputPath, audioBuffer);
            await execFile(ffmpegPath, ['-y', '-i', inputPath, '-af', 'aecho=0.8:0.9:1000:0.3', '-c:a', 'libopus', '-b:a', '64k', outputPath]);
            const result = fs.readFileSync(outputPath);
            await sock.sendMessage(from, { audio: result, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
            await prog.done(`${sec('ECHO')}\n${boxOpen()}\n${line('_Riverbero aggiunto!_')}\n${boxEnd()}`);
            fs.unlinkSync(inputPath); fs.unlinkSync(outputPath);
        } catch (e) {
            console.error('[echo]', e);
            reply('❌ Errore durante la creazione dell\'effetto.');
        }
    },
};