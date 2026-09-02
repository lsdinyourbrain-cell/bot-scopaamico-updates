'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'tempban',
    aliases: [],
    description: 'Ban temporaneo.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('TEMPBAN')}\n${boxOpen()}\n${line('Usa .tempban @user 1h — banna per 1h/1d.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
