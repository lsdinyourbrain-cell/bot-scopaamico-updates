'use strict';
const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'inculata',
    aliases: [],
    description: 'Inculata.',
    async run(sock, msg, args, context){
        const { from, sender, reply } = context;
        const targetJid = context.targetJid;
        if(!targetJid) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Tagga qualcuno o rispondi a un messaggio.')}\n${boxEnd()}`);
        const frasi=["con forza","piano","con lubrificante","a fondo","con gemiti"];
        const txt=frasi[Math.floor(Math.random()*frasi.length)];
        await sock.sendMessage(from,{ text: `${sec('INCULATA')}\n${boxOpen()}\n${line(`@${dispOf(sender)} inculata @${dispOf(targetJid)} ${txt}`)}\n${boxEnd()}`, mentions:[sender,targetJid] });
    }
};
