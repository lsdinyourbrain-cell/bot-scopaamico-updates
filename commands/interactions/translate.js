'use strict';

module.exports = {
    name: 'translate',
    aliases: ['traduci', 'tr'],
    description: "Traduce un testo in un'altra lingua (Google Translate, gratis). Uso: .translate <codice lingua> <testo> o .translate <testo> (auto -> it).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios, showProgress } = services;

        const quoted = isReply ? (contextInfo?.quotedMessage?.conversation || contextInfo?.quotedMessage?.extendedTextMessage?.text || '') : '';
        const input = String(quoted || textArgs || '').trim();
        if (!input) {
            return reply('⚠️ Scrivi il testo da tradurre.\n👉 *Uso:* `.translate it hello world` (o cita un messaggio)');
        }

        // Se il primo token è un codice lingua (es. it, en, es), lo usa come target.
        const LANG_RE = /^([a-z]{2})(\s+|$)/i;
        let target = 'it';
        let text = input;
        const m = input.match(LANG_RE);
        if (m && /^[a-z]{2}$/i.test(m[1])) {
            target = m[1].toLowerCase();
            text = input.slice(m[0].length).trim();
        }
        if (!text) text = input;

        try {
            const prog = await showProgress(sock, from, { label: 'TRADUZIONE', duration: 3000, quoted: msg });
            const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
                params: { client: 'gtx', sl: 'auto', tl: target, dt: 't', q: text.slice(0, 4000) },
                timeout: 10000,
            });
            const translated = (data?.[0] || []).map(seg => seg?.[0] || '').join('').trim();
            if (!translated) return prog.done('❌ Non riesco a tradurre questo testo.');
            const detected = data?.[2] || '?';
            await prog.done(`🌐 *Traduzione* (${detected} → ${target.toUpperCase()})\n\n${translated}`);
        } catch (_) {
            await reply('❌ Errore nella traduzione. Riprova più tardi.');
        }
    },
};