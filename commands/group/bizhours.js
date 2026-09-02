'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'bizhours',
    aliases: [],
    description: 'Orari business.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('BIZHOURS')}\n${boxOpen()}\n${line('Usa .bizhours 09:00-18:00 — imposta orari apertura.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
