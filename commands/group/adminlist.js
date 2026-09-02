'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'adminlist',
    aliases: [],
    description: 'Lista admin.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('ADMINLIST')}\n${boxOpen()}\n${line('Usa .adminlist — elenca admin con @tag.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
