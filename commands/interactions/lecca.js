'use strict';
const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'lecca',
    aliases: [],
    description: 'Lecca qualcuno.',
    async run(sock, msg, args, context){
        const { from, sender, reply } = context;
        const targetJid = context.targetJid;
        if(!targetJid) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Tagga qualcuno o rispondi a un messaggio.')}\n${boxEnd()}`);
        const frasi=['con passione 😋','lentamente 👅','fino a farlo impazzire','con dolcezza','senza fermarsi'];
        const txt=frasi[Math.floor(Math.random()*frasi.length)];
        await sock.sendMessage(from,{ text:`${sec('LECCA')}\n${boxOpen()}\n${line(`@${dispOf(sender)} lecca @${dispOf(targetJid)} ${txt}`)}\n${boxEnd()}`, mentions:[sender,targetJid] });
    }
};
