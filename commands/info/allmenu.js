'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'allmenu',
    aliases: ['allcommands','listacomandi'],
    description: 'Lista completa di tutti i comandi.',
    async run(sock, msg, args, context){
        const { from, reply, services } = context;
        const { commands } = services;
        const all = [...commands.values()].filter(c=>!c.hidden).map(c=>c.name).sort((a,b)=>a.localeCompare(b));
        let txt = `ㅤㅤ⋆｡˚『 ╭ \`ALLMENU\` ╯ 』˚｡⋆\n╭\n│ 📦 ${all.length} comandi • VEX BOT\n│ ⏱️ ${new Date().toLocaleTimeString('it-IT')}\n│\n`;
        for(const n of all) txt += `│ ➤ .${n}\n`;
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
