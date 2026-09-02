'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'sorte',
    aliases: [],
    description: 'Sorte del giorno.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('SORTE')}\n${boxOpen()}\n${line('SORTE - presto disponibile!')}\n${boxEnd()}` });
    }
};
