'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'allmenu',
    aliases: ['allcommands','listacomandi'],
    description: 'Lista completa di tutti i comandi.',
    async run(sock, msg, args, context){
        const { from, reply, services } = context;
        const { commands } = services;
        const all = [...commands.values()].filter(c=>!c.hidden).sort((a,b)=>a.name.localeCompare(b.name));
        const grouped = {};
        for(const c of all){
            const cat = (c.category || c.name[0] || 'altro').toUpperCase();
            if(!grouped[cat]) grouped[cat]=[];
            grouped[cat].push(c.name);
        }
        // Costruisci testo unico con grafica VEX, senza .txt
        let txt = `ㅤㅤ⋆｡˚『 ╭ \`ALLMENU\` ╯ 』˚｡⋆\n╭\n│ 📦 ${all.length} comandi totali\n│ ⏱️ ${new Date().toLocaleTimeString('it-IT')}\n`;
        for(const [cat, list] of Object.entries(grouped)){
            txt += `│\n│ ┌─ ${cat} (${list.length})\n`;
            // 4 per riga
            for(let i=0;i<list.length;i+=4){
                const chunk=list.slice(i,i+4).map(n=>`.${n}`).join(' ');
                txt += `│ ${chunk}\n`;
            }
        }
        txt += `╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─`;
        // Se supera 4000, spezza in più messaggi ma sempre testo
        const CHUNK=3500;
        if(txt.length <= CHUNK){
            return sock.sendMessage(from,{ text: txt },{ quoted: msg });
        }
        for(let i=0;i<txt.length;i+=CHUNK){
            const part=txt.slice(i,i+CHUNK);
            await sock.sendMessage(from,{ text: part },{ quoted: i===0?msg:undefined });
            await new Promise(r=>setTimeout(r,600));
        }
    }
};
