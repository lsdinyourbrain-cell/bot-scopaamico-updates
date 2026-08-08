'use strict';

module.exports = {
    name: 'bandiera',
    aliases: ['flag'],
    description: "Indovina la nazione dalla bandiera (multipla).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            const countries = [
                { code: 'IT', name: 'Italia' },
                { code: 'FR', name: 'Francia' },
                { code: 'DE', name: 'Germania' },
                { code: 'ES', name: 'Spagna' },
                { code: 'GB', name: 'Regno Unito' },
                { code: 'US', name: 'Stati Uniti' },
                { code: 'BR', name: 'Brasile' },
                { code: 'AR', name: 'Argentina' },
                { code: 'JP', name: 'Giappone' },
                { code: 'CN', name: 'Cina' },
                { code: 'RU', name: 'Russia' },
                { code: 'IN', name: 'India' },
                { code: 'AU', name: 'Australia' },
                { code: 'CA', name: 'Canada' },
                { code: 'MX', name: 'Messico' },
                { code: 'NL', name: 'Paesi Bassi' },
                { code: 'PT', name: 'Portogallo' },
                { code: 'SE', name: 'Svezia' },
                { code: 'CH', name: 'Svizzera' },
                { code: 'GR', name: 'Grecia' },
            ];

            const pick = countries[Math.floor(Math.random() * countries.length)];
            const others = countries.filter(c => c.code !== pick.code);
            const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
            const options = [pick, ...shuffled].sort(() => Math.random() - 0.5);
            const optLetters = ['A', 'B', 'C', 'D'];
            const correctIndex = options.findIndex(o => o.code === pick.code);

            if (!db[from]) db[from] = {};
            db[from].flagGame = {
                active: true,
                code: pick.code,
                correctIndex,
                timestamp: Date.now(),
            };
            saveDB();

            const optionsText = options.map((o, i) => `${optLetters[i]}) ${o.name}`).join('\n');

            try {
                const flagUrl = `https://flagcdn.com/w320/${pick.code.toLowerCase()}.png`;
                const caption = `╔══════════════════════════════════╗\n║    🏁 *INDOVINA LA BANDIERA* 🏁\n╠══════════════════════════════════╣\n║  ${optionsText.split('\n').join('\n║  ')}\n║\n║  ⚡ Rispondi con A/B/C/D!\n║  ⏳ Hai 30 secondi!\n╚══════════════════════════════════╝`;
                await sock.sendMessage(from, {
                    image: { url: flagUrl },
                    caption,
                }, { quoted: msg });

                setTimeout(() => {
                    if (db[from]?.flagGame?.active && db[from]?.flagGame?.code === pick.code) {
                        db[from].flagGame.active = false;
                        saveDB();
                        sock.sendMessage(from, { text: `⏰ Tempo scaduto! Era *${pick.name}* 🇺🇳` }).catch(() => {});
                    }
                }, 30000);
            } catch (e) {
                await reply("Non riesco a caricare la bandiera. Riprova più tardi.");
            }
    },
};
