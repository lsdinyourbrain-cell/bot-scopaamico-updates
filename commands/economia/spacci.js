'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'spacci',
    aliases: [],
    description: 'Spaccia.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('SPACCI')}\n${boxOpen()}\n${line('SPACCI - presto disponibile!')}\n${boxEnd()}` });
    }
};
