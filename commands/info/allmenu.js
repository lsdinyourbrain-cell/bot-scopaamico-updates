'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'allmenu',
    aliases: ['allcommands','listacomandi'],
    description: 'Lista completa di tutti i comandi.',
    async run(sock, msg, args, context){
        const { from, reply, services } = context;
        const { commands, sendButtons } = services;
        const all = [...commands.values()].filter(c=>!c.hidden).map(c=>c.name).sort((a,b)=>a.localeCompare(b));
        let txt = `ㅤㅤ⋆｡˚『 ╭ \`ALLMENU\` ╯ 』˚｡⋆\n╭\n│ 📦 ${all.length} comandi • VEX BOT\n│ ⏱️ ${new Date().toLocaleTimeString('it-IT')}\n│\n`;
        for(const n of all) txt += `│ • ${n}\n`;
        txt += `╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─\n_ℹ️ Esente — questo messaggio non attiva comandi_`;
        // Esente: usa "• nome" senza punto così il parser non triggera .nome anche se inoltrato
        // Se supera 4000, spezza in più messaggi ma sempre testo
        const CHUNK=3500;
        if(txt.length <= CHUNK){
            // single message via sendButtons (fallback to plain if >1024 auto-handled in helper)
            try {
                return await sendButtons(sock, from, txt, [
                    { label: '🏠 Menu', id: 'menu' },
                    { label: '📖 Guida', id: 'aiuto' },
                    { label: '⚡ Ping', id: 'ping' },
                ], msg);
            } catch(_) { return sock.sendMessage(from,{ text: txt },{ quoted: msg }); }
        }
        for(let i=0;i<txt.length;i+=CHUNK){
            const part=txt.slice(i,i+CHUNK);
            await sock.sendMessage(from,{ text: part },{ quoted: i===0?msg:undefined });
            await new Promise(r=>setTimeout(r,600));
        }
    }
};
