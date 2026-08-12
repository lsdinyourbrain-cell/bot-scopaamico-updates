'use strict';

module.exports = {
    name: 'ai',
    aliases: [],
    description: "Chiedi qualcosa all'intelligenza artificiale.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, showProgress } = services;


            if (!textArgs) return reply("Fammi una domanda! Esempio: `.ai Qual è la capitale della Francia?`");

            // ── SALVA LA API KEY (.ai set "sk-or-v1-...") ──────────────────
            // La key viene conservata nel database del bot (persistente, e
            // sincronizzata col backup Gist), quindi non serve modificare .env.
            const setMatch = textArgs.trim().match(/^set\s+(.+)$/i);
            if (setMatch) {
                const rawKey = setMatch[1].trim();
                const apiKey = rawKey.replace(/^["']|["']$/g, '');
                if (!apiKey || apiKey.length < 10) {
                    return reply("❌ Chiave non valida. Usa: `.ai set \"sk-or-v1-...\"`");
                }
                if (!db._ai) db._ai = {};
                db._ai.apiKey = apiKey;
                saveDB();
                return reply("✅ API Key salvata! Ora puoi usare `.ai <domanda>`. Per cambiarla, usa di nuovo `.ai set \"...\"`.");
            }

            // La key effettiva: quella salvata con .ai set, altrimenti .env
            const activeKey = (db?._ai?.apiKey) || AI_API_KEY;
            if (!activeKey || activeKey === 'INSERISCI_QUI_LA_TUA_API_KEY') {
                return reply("❌ API Key non configurata. Usa `.ai set \"sk-or-v1-...\"` (chiave di openrouter.ai) oppure aggiungi `AI_API_KEY=...` nel file *.env*.");
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
