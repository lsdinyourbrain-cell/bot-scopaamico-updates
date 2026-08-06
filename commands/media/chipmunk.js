'use strict';

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('../../lib/ffmpeg-path').getFfmpegPath();
const path = require('path');
ffmpeg.setFfmpegPath(ffmpegPath);
const { promisify } = require('util');
const execFile = promisify(require('child_process').execFile);

module.exports = {
    name: 'chipmunk',
    aliases: ['scimmia', 'scoiattolo', 'vocale'],
    description: 'Velocizza un messaggio vocale effetto scoiattolo (chipmunk).',

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, reply, targetJid, isReply, contextInfo, textArgs, services } = context;
        const { downloadMediaMessage, showProgress } = services;

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
                        message: {
                            audioMessage: audioMsg
                        }
                    };
                    audioBuffer = await downloadMediaMessage(quotedMsg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                }
            }

            if (!audioBuffer) {
                return reply('🎤 *Chipmunk Effect*\n\nRispondi a un messaggio vocale con *.chipmunk* per velocizzarlo!\n\nEsempio:\n1. Qualcuno manda un vocale\n2. Rispondi al vocale scrivendo *.chipmunk*');
            }

            const prog = await showProgress(sock, from, { label: 'CHIPMUNK', duration: 2500, quoted: msg });

            const os = require('os');
            const fs = require('fs');
            const tmpDir = os.tmpdir();
            const inputPath = path.join(tmpDir, `chipmunk_input_${Date.now()}.opus`);
            const outputPath = path.join(tmpDir, `chipmunk_output_${Date.now()}.opus`);

            fs.writeFileSync(inputPath, audioBuffer);

            // Effetto chipmunk: velocizza 2x e alza pitch
            await execFile(ffmpegPath, [
                '-y',
                '-i', inputPath,
                '-af', 'atempo=2.0,asetrate=48000*1.5,aresample=48000',
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
            await prog.done('🐿️ *Effetto scoiattolo pronto!* ✅');

            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

        } catch (e) {
            console.error('[chipmunk]', e);
            await reply('❌ Errore durante la creazione dell\'effetto. Assicurati che sia un vocale valido.');
        }
    },
};