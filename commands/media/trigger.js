'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'trigger',
    aliases: [],
    description: 'Trigger efecto.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('TRIGGER')}\n${boxOpen()}\n${line('TRIGGER - presto disponibile!')}\n${boxEnd()}` });
    }
};
