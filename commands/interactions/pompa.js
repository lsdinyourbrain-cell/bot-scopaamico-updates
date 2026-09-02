'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'pompa',
    aliases: [],
    description: 'Pompa.',
    async run(sock, msg, args, context){
        const { from, sender, reply } = context;
        const targetJid = context.targetJid;
        if(!targetJid) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Tagga qualcuno o rispondi a un messaggio.')}\n${boxEnd()}`);
        const frasi=["con la mano","con la bocca","veloce","lentamente","con passione"];
        const txt=frasi[Math.floor(Math.random()*frasi.length)];
        await sock.sendMessage(from,{ text: `${sec('POMPA')}\n${boxOpen()}\n${line(`@${sender.split('@')[0]} pompa @${targetJid.split('@')[0]} ${txt}`)}\n${boxEnd()}`, mentions:[sender,targetJid] });
    }
};
