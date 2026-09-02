'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'beautiful',
    aliases: [],
    description: 'Beautiful meme.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('BEAUTIFUL')}\n${boxOpen()}\n${line('BEAUTIFUL - presto disponibile!')}\n${boxEnd()}` });
    }
};
