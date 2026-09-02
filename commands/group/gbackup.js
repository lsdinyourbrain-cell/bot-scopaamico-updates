'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'gbackup',
    aliases: [],
    description: 'Backup gruppo.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('GBACKUP')}\n${boxOpen()}\n${line('Usa .gbackup — salva foto/nome/desc su gist.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
