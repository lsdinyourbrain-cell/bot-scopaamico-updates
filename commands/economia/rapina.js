'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'rapina',
    aliases: [],
    description: 'Rapina banca.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('RAPINA')}\n${boxOpen()}\n${line('RAPINA - presto disponibile!')}\n${boxEnd()}` });
    }
};
