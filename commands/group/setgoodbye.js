'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'setgoodbye',
    aliases: [],
    description: 'Imposta addio.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('SETGOODBYE')}\n${boxOpen()}\n${line('Usa .setgoodbye Ciao @user — imposta messaggio goodbye custom.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
