'use strict';

module.exports = {
    name: 'meme',
    aliases: [],
    description: "Esegue il comando .meme.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const audioDir = path.join(projectDir, 'audio');
            
            if (!fs.existsSync(audioDir)) {
                return reply("⚠️ _Errore: La cartella \`/audio\` non esiste nel sistema._");
            }
            
            const files = fs.readdirSync(audioDir)
                .filter(file => path.extname(file).toLowerCase() === '.mp3');
            
            if (files.length === 0) {
                return reply("⚠️ _Errore: Nessun file \`.mp3\` trovato nella cartella \`/audio\`._");
            }
            
            const randomAudio = files[Math.floor(Math.random() * files.length)];
            const audioPath = path.join(audioDir, randomAudio);

            try {
                const audioBuffer = fs.readFileSync(audioPath);
                if (audioBuffer.length === 0) throw new Error('File audio vuoto');

                await sock.sendMessage(from, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    fileName: randomAudio,
                    ptt: false,
                }, { quoted: msg });
            } catch (e) {
                console.error('[orgasmo]', e.message);
                await reply("⚠️ _Errore: Impossibile inviare l'audio._");
            }
    },
};
