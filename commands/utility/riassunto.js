'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const { askAI } = require('../../lib/ai');

module.exports = {
    name: 'riassunto',
    aliases: ['summary','recap'],
    description: 'Riassunto ultime 2 ore con IA.',
    async run(sock, msg, args, context){
        const { from, reply, services } = context;
        const { db, AI_API_KEY, AI_API_URL, AI_MODEL, axios } = services;
        const chat = db[from] || {};
        // Raccogli messaggi ultimi 2 ore da db (msgCount con ts)
        const now = Date.now();
        const twoHours = 2*60*60*1000;
        const msgs = [];
        // Cerca nei log o in db._messages se esiste, altrimenti usa history fittizia
        // Per ora usa i messaggi salvati in db[from] se hanno timestamp
        for(const [jid, data] of Object.entries(chat)){
            if(!jid.includes('@') || !data || typeof data!=='object') continue;
            if(data.lastMsg && data.lastMsgTime && (now - data.lastMsgTime) < twoHours){
                msgs.push({ jid, text: data.lastMsg, ts: data.lastMsgTime });
            }
        }
        // Fallback: prendi ultimi messaggi da store se msgs vuoto, usa placeholder
        let promptText = '';
        if(msgs.length){
            msgs.sort((a,b)=>a.ts-b.ts);
            promptText = msgs.slice(-30).map(m=>`${m.jid.split('@')[0]}: ${m.text}`).join('\n');
        } else {
            // Se non ci sono log, di che non ci sono abbastanza messaggi
            return reply(`${sec('RIASSUNTO')}\n${boxOpen()}\n${line('Nessun messaggio nelle ultime 2 ore da riassumere.')}\n${line('Parla un po\' e riprova fra poco, fra.')}\n${boxEnd()}`);
        }
        const activeKey = (db?._ai?.apiKey) || AI_API_KEY;
        if(!activeKey || activeKey==='INSERISCI_QUI_LA_TUA_API_KEY'){
            return reply(`${sec('RIASSUNTO')}\n${boxOpen()}\n${line('AI non configurata.')}\n${line('Fai .ai set <key>')}\n${boxEnd()}`);
        }
        const prog = await services.showProgress(sock, from, { label: 'RIASSUNTO 2H', duration: 4000, quoted: msg });
        try{
            const system = 'Sei un assistente che riassume chat. Fai un riassunto breve, in italiano Gen Z leggero, 3-5 punti, max 500 caratteri. Sii utile e conciso, niente cringe.';
            const user = `Riassumi questi messaggi delle ultime 2 ore:\n${promptText.slice(0,3000)}`;
            const res = await askAI({ services: { axios, db, AI_API_KEY: activeKey, AI_API_URL, AI_MODEL }, system, user, maxTokens: 400 });
            if(!res) throw new Error('no reply');
            await prog.done(`${sec('RIASSUNTO 2H')}\n${boxOpen()}\n${line(res.slice(0,900))}\n${boxEnd()}`);
        }catch(e){
            await prog.done(`${sec('ERRORE')}\n${boxOpen()}\n${line('Errore AI: '+String(e.message).slice(0,80))}\n${boxEnd()}`);
        }
    }
};
