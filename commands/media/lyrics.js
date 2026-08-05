'use strict';

module.exports = {
    name: 'lyrics',
    aliases: [],
    description: "Cerca il testo di una canzone.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            if (!textArgs) return sendButtons(sock, from,
                "🎤 *Manca la canzone!*\n\nEsempio: `.lyrics Blinding Lights The Weeknd`",
                [{ label: '🎵 .lyrics Blinding Lights', id: 'lyrics Blinding Lights The Weeknd' }],
                msg);;
            try {
                const search = await axios.get('https://itunes.apple.com/search', {
                    params: { term: textArgs, entity: 'song', limit: 1 },
                    timeout: 10_000,
                });
                const song = search.data?.results?.[0];
                if (!song) return reply("Non ho trovato quella canzone.");

                const title = song.trackName;
                const artist = song.artistName;

                let lyrics;
                try {
                    const lyrRes = await axios.get(
                        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
                        { timeout: 10_000 }
                    );
                    lyrics = lyrRes.data?.lyrics?.trim();
                } catch (_) {
                    try {
                        const fallback = await axios.get(
                            `https://lyrist.vercel.app/api/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`,
                            { timeout: 10_000 }
                        );
                        lyrics = fallback.data?.lyrics?.trim();
                    } catch (_2) {
                        lyrics = null;
                    }
                }

                if (!lyrics) return reply(`Ho trovato *${title}* — _${artist}_, ma il testo non è disponibile.`);

                await reply(`🎤 *${title}* — _${artist}_\n\n${lyrics.slice(0, 6000)}${lyrics.length > 6000 ? '\n\n…testo tagliato qui.' : ''}`);

                if (song.previewUrl) {
                    if (!db[from]) db[from] = {};
                    db[from].pendingMp3 = {
                        sender,
                        previewUrl: song.previewUrl,
                        title,
                        artist,
                        timestamp: Date.now(),
                    };
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `🎵 @${sender.split('@')[0]}, vuoi anche l\'anteprima MP3? Rispondi *si* o *no*.`,
                        mentions: [sender],
                    });

                    setTimeout(() => {
                        if (db[from]?.pendingMp3?.sender === sender) {
                            delete db[from].pendingMp3;
                            saveDB();
                        }
                    }, 30000);
                }
            } catch (_) {
                await reply("Non riesco a recuperare il testo in questo momento. Riprova più tardi.");
            }
    },
};
