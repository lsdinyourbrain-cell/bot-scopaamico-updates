'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

module.exports = {
    name: 'sponsor',
    aliases: ['sponsorizza', 'pub'],
    description: "Mostra o imposta lo sponsor del bot.",

    async run(sock, msg, args, context) {
        const { textArgs, from, isOwner, reply, services } = context;
        const { db, saveDB } = services;
        const arg = String(textArgs||'').trim();
        // Owner può impostare: .sponsor https://chat.whatsapp.com/XXX
        if(arg && /^https?:\/\/\S+/i.test(arg)){
            if(!isOwner) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo owner può impostare lo sponsor.')}\n${boxEnd()}`);
            db._config = db._config || {};
            db._config.sponsorLink = arg;
            saveDB();
            return reply(`${sec('SPONSOR')}\n${boxOpen()}\n${line('Link sponsor aggiornato!')}\n${line(arg.slice(0,60))}\n${boxEnd()}`);
        }
        const link = db._config?.sponsorLink || 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo?s=cl&p=a&ilr=0';
        const txt = `${sec('SPONSOR')}\n${boxOpen()}\n${line('✨ Unisciti al gruppo ufficiale VEX ✨')}\n${line('Tocca il pulsante qui sotto 👇')}\n${boxEnd()}`;
        try{
            const { sendButtons } = services;
            if(sendButtons) return sendButtons(sock, from, txt, [{ type:'copy', label:'🔗 Copia link', copy: link }, { label:'🚀 Unisciti', url: link }], msg, null, { headerTitle:'💎 VEX SPONSOR', footerText:'Tocca per aprire' });
        }catch(_){}
        await sock.sendMessage(from, { text: txt + `\n${link}` }, { quoted: msg });
    },
};
