'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'setwelcome',
    aliases: [],
    description: 'Imposta benvenuto.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('SETWELCOME')}\n${boxOpen()}\n${line('Usa .setwelcome Ciao @user benvenuto in @group — placeholder @user @group @desc.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
