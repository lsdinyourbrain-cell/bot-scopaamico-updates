'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// Difficoltà: facile 10s low reward, media 7s, difficile 5s high reward
const DIFFICULTIES = {
    facile:    { key: 'facile',    label: 'FACILE',    emoji: '🟢', timeout: 10000, reward: 50 },
    media:     { key: 'media',     label: 'MEDIA',     emoji: '🟡', timeout: 7000,  reward: 100 },
    difficile: { key: 'difficile', label: 'DIFFICILE', emoji: '🔴', timeout: 5000,  reward: 150 },
};

module.exports = {
    name: 'bandiera',
    aliases: ['flag'],
    description: "Indovina la nazione dalla bandiera (multipla). Difficoltà: facile/media/difficile (facile=10s, media=7s, difficile=5s).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;

            const qLower = String(textArgs || '').trim().toLowerCase();
            const isQuit = ['stop','termina','abbandona','annulla','fine','esci','basta','chiudi','ferma','lascia'].includes(qLower) || qLower.startsWith('stop ') || qLower.startsWith('termina') || qLower.startsWith('abbandona') || qLower.startsWith('annulla');
            if (isQuit) {
                if (!db[from]?.flagGame?.active) return reply("Nessuna bandiera attiva.");
                db[from].flagGame.active = false;
                saveDB();
                const t = `${sec('🛑 BANDIERA TERMINATA')}\n${boxOpen()}\n${line(`Gioco terminato da @${sender.split('@')[0]} ✨`)}\n${boxEnd()}`;
                if (sendButtons) {
                    return sendButtons(sock, from, t, [
                        { label: '🔄 Nuova bandiera', id: 'bandiera' },
                        { label: '🏠 Menu', id: 'menu' },
                    ], msg, [sender]);
                }
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            if (db[from]?.flagGame?.active) {
                const t = `${sec('🏁 BANDIERA ATTIVA')}\n${boxOpen()}\n${line('C\'è già una bandiera in corso ✨')}\n${line('Rispondi *A/B/C/D* oppure termina')}\n${boxEnd()}`;
                if (sendButtons) {
                    return sendButtons(sock, from, t, [
                        { label: '❌ Termina', id: 'bandiera termina' },
                        { label: '🔄 Nuova bandiera', id: 'bandiera termina' },
                    ], msg);
                }
            }


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

            // Difficoltà richiesta (default facile = 10s low reward)
            const rawDiffBand = String(textArgs || '').trim().toLowerCase().split(/\s+/)[0];
            const diffBandKey = DIFFICULTIES[rawDiffBand] ? rawDiffBand : 'facile';
            const diffBand = DIFFICULTIES[diffBandKey];

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
                difficulty: diffBand.key,
                reward: diffBand.reward,
                timeout: diffBand.timeout,
            };
            saveDB();

            const optionsText = options.map((o, i) => line(`${optLetters[i]}) ${o.name}`)).join('\n');

            try {
                const flagUrl = `https://flagcdn.com/w320/${pick.code.toLowerCase()}.png`;
                const caption = `${sec('INDOVINA LA BANDIERA')}\n${boxOpen()}\n${optionsText}\n${line(`${diffBand.emoji} ${diffBand.label} · ⏳ ${diffBand.timeout/1000}s · 💰 ${diffBand.reward}€`)}\n${line('⚡ Rispondi con A/B/C/D!')}\n${boxEnd()}`;
                await sock.sendMessage(from, {
                    image: { url: flagUrl },
                    caption,
                }, { quoted: msg });
                if (sendButtons) {
                    try {
                        await sendButtons(sock, from, `${sec('🏁 BANDIERA CONTROLLI')}\n${boxOpen()}\n${line(`Bandiera in corso ✨ — ${diffBand.emoji} ${diffBand.label}`)}\n${line('❌ Termina — annulla')}\n${line('🔄 Nuova — termina e rigioca')}\n${boxEnd()}`, [
                            { label: '❌ Termina', id: 'bandiera termina' },
                            { label: '🔄 Nuova bandiera', id: 'bandiera termina' },
                        ], msg);
                    } catch (_) {}
                }

                setTimeout(() => {
                    if (db[from]?.flagGame?.active && db[from]?.flagGame?.code === pick.code) {
                        db[from].flagGame.active = false;
                        saveDB();
                        sock.sendMessage(from, { text: `${sec('TEMPO SCADUTO')}\n${boxOpen()}\n${line(`Era *${pick.name}*` )}\n${line(`⏳ ${diffBand.timeout/1000}s scaduti — ${diffBand.emoji} ${diffBand.label}`)}\n${boxEnd()}` }).catch(() => {});
                    }
                }, diffBand.timeout);
            } catch (e) {
                await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Non riesco a caricare la bandiera. Riprova più tardi.')}\n${boxEnd()}`);
            }
    },
};
