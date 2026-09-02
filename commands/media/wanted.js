'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'wanted',
    aliases: [],
    description: 'Wanted poster.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('WANTED')}\n${boxOpen()}\n${line('WANTED - presto disponibile!')}\n${boxEnd()}` });
    }
};
