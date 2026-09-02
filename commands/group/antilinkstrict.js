'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'antilinkstrict',
    aliases: [],
    description: 'Antilink strict.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('ANTILINKSTRICT')}\n${boxOpen()}\n${line('Usa .antilinkstrict on/off — blocca qualsiasi link.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
