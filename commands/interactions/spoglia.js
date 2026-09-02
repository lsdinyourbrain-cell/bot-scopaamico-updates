'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'spoglia',
    aliases: [],
    description: 'Spoglia.',
    async run(sock, msg, args, context){
        const { from, sender, reply } = context;
        const targetJid = context.targetJid;
        if(!targetJid) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Tagga qualcuno o rispondi a un messaggio.')}\n${boxEnd()}`);
        const frasi=["lentamente","con malizia","pezzo per pezzo","guardando","con desiderio"];
        const txt=frasi[Math.floor(Math.random()*frasi.length)];
        await sock.sendMessage(from,{ text: `${sec('SPOGLIA')}\n${boxOpen()}\n${line(`@${sender.split('@')[0]} spoglia @${targetJid.split('@')[0]} ${txt}`)}\n${boxEnd()}`, mentions:[sender,targetJid] });
    }
};
