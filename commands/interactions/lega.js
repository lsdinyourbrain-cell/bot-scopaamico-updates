'use strict';
const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'lega',
    aliases: [],
    description: 'Lega.',
    async run(sock, msg, args, context){
        const { from, sender, reply } = context;
        const targetJid = context.targetJid;
        if(!targetJid) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Tagga qualcuno o rispondi a un messaggio.')}\n${boxEnd()}`);
        const frasi=["le mani","al letto","con corda","stretta","con fantasia"];
        const txt=frasi[Math.floor(Math.random()*frasi.length)];
        await sock.sendMessage(from,{ text: `${sec('LEGA')}\n${boxOpen()}\n${line(`@${dispOf(sender)} lega @${dispOf(targetJid)} ${txt}`)}\n${boxEnd()}`, mentions:[sender,targetJid] });
    }
};
