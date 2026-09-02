'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'oracolo',
    aliases: [],
    description: 'Oracolo magico, chiedi e ti risponde.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('ORACOLO')}\n${boxOpen()}\n${line('ORACOLO - presto disponibile!')}\n${boxEnd()}` });
    }
};
