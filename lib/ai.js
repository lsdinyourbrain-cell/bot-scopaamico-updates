'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  AI — ScopaAmico Bot
//  Helper per chiamare l'IA (OpenRouter) dai comandi che ne hanno bisogno
//  (.storia, .genio, .fakenews). Riusa la key salvata con `.ai set` oppure
//  quella in .env (AI_API_KEY). Ritorna null se non c'è una key valida.
// ─────────────────────────────────────────────────────────────────────────────

const askAI = async ({ services, system, user, maxTokens = 800 }) => {
    const { axios, db, AI_API_KEY, AI_API_URL, AI_MODEL } = services;
    const activeKey = (db?._ai?.apiKey) || AI_API_KEY;
    if (!activeKey || activeKey === 'INSERISCI_QUI_LA_TUA_API_KEY') return null;

    const response = await axios.post(AI_API_URL, {
        model: AI_MODEL,
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
    }, {
        headers: {
            'Authorization': `Bearer ${activeKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/ScopaAmicoBot',
            'X-Title': 'ScopaAmico Bot',
        },
        timeout: 30000,
    });
    return response.data?.choices?.[0]?.message?.content?.trim() || null;
};

const needKey = () =>
    "❌ API Key non configurata.\nUsa `.ai set \"sk-or-v1-...\"`\n(chiave di openrouter.ai).";

module.exports = { askAI, needKey };
