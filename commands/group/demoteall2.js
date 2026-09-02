'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'demoteall2',
    aliases: [],
    description: 'Demote all.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('DEMOTEALL2')}\n${boxOpen()}\n${line('Usa .demoteall2 — toglie admin a tutti tranne bot.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
