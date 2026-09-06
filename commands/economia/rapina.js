'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
module.exports = {
    name: 'rapina',
    aliases: [],
    description: 'Rapina banca.',
    async run(sock, msg, args, context){
        const { from, sender } = context;
        await sock.sendMessage(from,{ text: `${sec('RAPINA')}\n${boxOpen()}\n${line('RAPINA - bro è in arrivo — ci stiamo lavorando, stay tuned 🔥')}\n${boxEnd()}` });
    }
};
