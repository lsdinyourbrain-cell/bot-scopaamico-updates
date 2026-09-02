'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'welcome2',
    aliases: [],
    description: 'Welcome2.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('WELCOME2')}\n${boxOpen()}\n${line('Usa .welcome2 on/off — secondo benvenuto con immagine.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
