'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'dado2',
    aliases: [],
    description: 'Dado 2.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('DADO2')}\n${boxOpen()}\n${line('DADO2 - presto disponibile!')}\n${boxEnd()}` });
    }
};
