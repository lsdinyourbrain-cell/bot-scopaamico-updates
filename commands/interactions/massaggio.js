'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'massaggio',
    aliases: [],
    description: 'Massaggio erotico.',
    async run(sock, msg, args, context){
        const { from, sender, reply } = context;
        const targetJid = context.targetJid;
        if(!targetJid) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Tagga qualcuno o rispondi a un messaggio.')}\n${boxEnd()}`);
        const frasi=["con olio","su tutto il corpo","mani calde","lentamente","fino a gemere"];
        const txt=frasi[Math.floor(Math.random()*frasi.length)];
        await sock.sendMessage(from,{ text: `${sec('MASSAGGIO')}\n${boxOpen()}\n${line(`@${sender.split('@')[0]} massaggio @${targetJid.split('@')[0]} ${txt}`)}\n${boxEnd()}`, mentions:[sender,targetJid] });
    }
};
