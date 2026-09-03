'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'ai',
    aliases: [],
    description: "Chiedi qualcosa all'intelligenza artificiale.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, showProgress } = services;


            if (!textArgs) {
                const t = `${sec('🤖 AI GLASS')}\n${boxOpen()}\n${line('💎 Fammi una domanda nel vetro ✨🔮')}\n${line('📌 Esempio: *.ai Qual è la capitale d\'Italia?* 💫')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }

            const setMatch = textArgs.trim().match(/^set\s+(.+)$/i);
            if (setMatch) {
                const rawKey = setMatch[1].trim();
                const apiKey = rawKey.replace(/^["']|["']$/g, '');
                if (!apiKey || apiKey.length < 10) {
                    const t = `${sec('❌ AI ERRORE')}\n${boxOpen()}\n${line('💎 Chiave non valida ✨')}\n${line('📌 Usa: *.ai set "sk-or-v1-..."* 💫')}\n${boxEnd()}`;
                    return sock.sendMessage(from, { text: t }, { quoted: msg });
                }
                if (!db._ai) db._ai = {};
                db._ai.apiKey = apiKey;
                saveDB();
                const t2 = `${sec('✅ AI GLASS')}\n${boxOpen()}\n${line('💎 API Key salvata nel vetro ✨🔮')}\n${line('💫 Ora usa *.ai <domanda>* 💎')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t2 }, { quoted: msg });
            }

            const activeKey = (db?._ai?.apiKey) || AI_API_KEY;
            if (!activeKey || activeKey === 'INSERISCI_QUI_LA_TUA_API_KEY') {
                const t = `${sec('🔑 AI CONFIG')}\n${boxOpen()}\n${line('💎 API Key mancante nel vetro ✨')}\n${line('📌 Usa: *.ai set "sk-or-v1-..."* 🔮')}\n${line('💫 Oppure imposta *AI_API_KEY* in .env')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            try {
                const prog = await showProgress(sock, from, { label: 'INTELLIGENZA ARTIFICIALE', duration: 5000, quoted: msg });
                const response = await axios.post(AI_API_URL, {
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: 'Sei un assistente utile, simpatico e amichevole. Rispondi in italiano in modo conciso ma completo.' },
                        { role: 'user', content: textArgs }
                    ],
                    max_tokens: 1024,
                }, {
                    headers: {
                        'Authorization': `Bearer ${activeKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/VexBot',
                        'X-Title': 'Vex Bot',
                    },
                    timeout: 30000,
                });
                const replyText = response.data?.choices?.[0]?.message?.content?.trim();
                if (!replyText) {
                    const t = `${sec('🤖 AI GLASS')}\n${boxOpen()}\n${line('💎 L\'IA non ha risposto ✨')}\n${line('🔮 _Riprova più tardi_ 💫')}\n${boxEnd()}`;
                    return sock.sendMessage(from, { text: t }, { quoted: msg });
                }
                await prog.done(`${sec('🤖 AI GLASS')}\n${boxOpen()}\n${line(`💎 Risposta vetro per @${sender.split('@')[0]} ✨🔮`)}\n${line('')}\n${line(replyText.slice(0,1200))}\n${boxEnd()}`);
            } catch (e) {
                const errMsg = e.response?.data?.error?.message || e.response?.data?.error || e.message;
                console.error('[ai]', errMsg);
                const t = `${sec('❌ AI ERRORE')}\n${boxOpen()}\n${line(`💎 Errore vetro: _${String(errMsg).slice(0,120)}_ ✨`)}\n${boxEnd()}`;
                await sock.sendMessage(from, { text: t }, { quoted: msg });
            }
    },
};
