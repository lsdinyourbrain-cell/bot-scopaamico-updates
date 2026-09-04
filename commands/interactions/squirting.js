'use strict';
const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'squirting',
    aliases: [],
    description: 'Squirting.',
    async run(sock, msg, args, context){
        const { from, sender, reply } = context;
        const targetJid = context.targetJid;
        if(!targetJid) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Tagga qualcuno o rispondi a un messaggio.')}\n${boxEnd()}`);
        const frasi=["fino a bagnare","con le dita","con lingua","con forza","a fontana"];
        const txt=frasi[Math.floor(Math.random()*frasi.length)];
        await sock.sendMessage(from,{ text: `${sec('SQUIRTING')}\n${boxOpen()}\n${line(`@${dispOf(sender)} squirting @${dispOf(targetJid)} ${txt}`)}\n${boxEnd()}`, mentions:[sender,targetJid] });
    }
};
