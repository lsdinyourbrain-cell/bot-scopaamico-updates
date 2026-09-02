'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'antispam',
    aliases: [],
    description: 'Anti spam flood.',
    async run(sock, msg, args, context){
        const { from, isGroup, isSenderAdmin, isBotAdmin } = context;
        if(!isGroup) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gruppi.')}\n${boxEnd()}`);
        if(!isSenderAdmin) return context.reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo admin.')}\n${boxEnd()}`);
        await sock.sendMessage(from,{ text: `${sec('ANTISPAM')}\n${boxOpen()}\n${line('Usa .antispam on/off — kicka chi spamma 5+ msg in 10s.')}\n${line('Stato: demo — funzione presto attiva.')}\n${boxEnd()}` });
    }
};
