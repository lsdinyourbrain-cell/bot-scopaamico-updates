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
    name: 'drunk',
    aliases: ['ubriaco', 'barcollante', 'wobble'],
    description: 'Effetto voce ubriaca/barcollante (pitch instabile).',

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
            if (!audioBuffer) return reply('⚠️ _[uso]: rispondi a un vocale con *.drunk* per effetto ubriaco._');

            const prog = await showProgress(sock, from, { label: 'VOCE UBRIACA', duration: 2500, quoted: msg });
            const inputPath = path.join(TMP_DIR, `drunk_in_${Date.now()}.opus`);
            const outputPath = path.join(TMP_DIR, `drunk_out_${Date.now()}.opus`);
            fs.writeFileSync(inputPath, audioBuffer);
            await execFile(ffmpegPath, ['-y', '-i', inputPath, '-af', 'vibrato=f=5:d=0.5,aecho=0.8:0.9:200:0.2,asetrate=48000*0.95,aresample=48000', '-c:a', 'libopus', '-b:a', '64k', outputPath]);
            const result = fs.readFileSync(outputPath);
            await sock.sendMessage(from, { audio: result, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
            await prog.done('🍻 *_DRUNK_*\n━━━━━━━━━━━━━━\n▸ _Effetto ubriaco pronto!_\n◈ _Vex Bot_');
            fs.unlinkSync(inputPath); fs.unlinkSync(outputPath);
        } catch (e) {
            console.error('[drunk]', e);
            reply('❌ Errore durante la creazione dell\'effetto.');
        }
    },
};