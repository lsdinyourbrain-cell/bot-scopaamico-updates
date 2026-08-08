'use strict';

module.exports = {
    name: 'ai',
    aliases: [],
    description: "Chiedi qualcosa all'intelligenza artificiale.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, showProgress } = services;


            if (!textArgs) return reply("Fammi una domanda! Esempio: `.ai Qual è la capitale della Francia?`");
            if (!AI_API_KEY || AI_API_KEY === 'INSERISCI_QUI_LA_TUA_API_KEY') return reply("❌ API Key non configurata. Aggiungi `AI_API_KEY=...` nel file *.env*.");
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
                        'Authorization': `Bearer ${AI_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/ScopaAmicoBot',
                        'X-Title': 'ScopaAmico Bot',
                    },
                    timeout: 30000,
                });
                const replyText = response.data?.choices?.[0]?.message?.content?.trim();
                if (!replyText) return reply("❌ L'IA non ha prodotto una risposta valida.");
                await prog.done(`🤖 *AI*\n\n${replyText}`);
            } catch (e) {
                const errMsg = e.response?.data?.error?.message || e.response?.data?.error || e.message;
                console.error('[ai]', errMsg);
                await reply(`❌ Errore AI: ${errMsg}`);
            }
    },
};
