'use strict';
const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'pizzica',
    aliases: [],
    description: 'Pizzica.',
    async run(sock, msg, args, context){
        const { from, sender, reply } = context;
        const targetJid = context.targetJid;
        if(!targetJid) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Tagga qualcuno o rispondi a un messaggio.')}\n${boxEnd()}`);
        const frasi=["il culo","le guance","con dolcezza","con malizia","a sorpresa"];
        const txt=frasi[Math.floor(Math.random()*frasi.length)];
        await sock.sendMessage(from,{ text: `${sec('PIZZICA')}\n${boxOpen()}\n${line(`@${dispOf(sender)} pizzica @${dispOf(targetJid)} ${txt}`)}\n${boxEnd()}`, mentions:[sender,targetJid] });
    }
};
