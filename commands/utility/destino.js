'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'destino',
    aliases: [],
    description: 'Destino.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('DESTINO')}\n${boxOpen()}\n${line('DESTINO - presto disponibile!')}\n${boxEnd()}` });
    }
};
