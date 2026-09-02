'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'antiimage',
    aliases: [],
    description: 'Limita immagini.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('ANTIIMAGE')}\n${boxOpen()}\n${line('Usa .antiimage on/off — consente solo admin a inviare foto.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
