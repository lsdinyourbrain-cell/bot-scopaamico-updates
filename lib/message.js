'use strict';

const { BOT_IDENTITY, SYSTEM_FOOTER } = require('../config');

function extractBody(msg) {
    const message = msg.message;
    if (!message) return '';
    return message.conversation
        || message.extendedTextMessage?.text
        || message.imageMessage?.caption
        || message.videoMessage?.caption
        || message.buttonsResponseMessage?.selectedButtonId
        || message.listResponseMessage?.singleSelectReply?.selectedRowId
        || '';
}

const getContextInfo = (message = {}) => message.extendedTextMessage?.contextInfo
    || message.imageMessage?.contextInfo
    || message.videoMessage?.contextInfo
    || {};

const getQuotedKey = (chatId, contextInfo) => ({
    remoteJid: chatId,
    fromMe: false,
    id: contextInfo.stanzaId,
    participant: contextInfo.participant,
});

function withFooter(text) {
    return text.includes(BOT_IDENTITY) ? text : `${text}\n\n${SYSTEM_FOOTER}`;
}

function createSystemSender(sock, from, msg) {
    return async (content, options = {}) => {
        const payload = typeof content === 'string' ? { text: content } : { ...content };
        if (payload.text) payload.text = withFooter(payload.text);
        if (payload.caption) payload.caption = withFooter(payload.caption);
        return sock.sendMessage(from, payload, { quoted: msg, ...options });
    };
}

function createReply(sock, from, msg) {
    const sendSystem = createSystemSender(sock, from, msg);
    const decorateIfPlain = (t) => {
        if (!t || typeof t !== 'string' || t.includes('⋆｡˚') || t.includes('╰⭒')) return t;
        let body = String(t).replace(/◈\s*_Vex Bot_\s*/gi,'').trim();
        body = body.split('\n').map(l=>{ const s=l.trim(); if(/^[━─═━┈╌─]+$/.test(s)||/^◈/.test(s)) return ''; return l; }).join('\n').replace(/\n{3,}/g,'\n\n').trim();
        if(!body) return t;
        let title='VEX';
        const m1=body.match(/^\s*[^\n]*\*([^*]{2,15})\*/);
        if(m1){ const c=m1[1].replace(/[_*`]/g,'').trim().toUpperCase().slice(0,12); if(c) title=c; }
        const lines=body.split('\n').map(l=>{ let s=l.trim(); if(!s) return ''; return '│ '+s.replace(/^▸\s*/,'').replace(/^•\s*/,''); }).filter(Boolean).join('\n');
        if(lines) return `ㅤㅤ⋆｡˚『 ╭ \`${title}\` ╯ 』˚｡⋆\n╭\n${lines}\n╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─`;
        return t;
    };
    return async (text, { footer = true } = {}) => {
        try {
            const decorated = decorateIfPlain(text);
            return footer
                ? await sendSystem(decorated)
                : await sock.sendMessage(from, { text: decorated }, { quoted: msg });
        } catch (error) {
            console.error(`[reply] Errore invio: ${error.message}`);
            return null;
        }
    };
}

module.exports = { extractBody, getContextInfo, getQuotedKey, withFooter, createSystemSender, createReply };
