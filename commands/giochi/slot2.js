'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'slot2',
    aliases: [],
    description: 'Slot 2.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('SLOT2')}\n${boxOpen()}\n${line('SLOT2 - presto disponibile!')}\n${boxEnd()}` });
    }
};
