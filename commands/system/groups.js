'use strict';

module.exports = {
    name: 'groups',
    aliases: ['grouplist', 'listgroups', 'mieigruppi'],
    description: "Mostra tutti i gruppi dov'è il bot (owner).",

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, reply } = context;

        if (!isOwner) return reply("Solo il proprietario.");

        try {
            const groups = await sock.groupFetchAllParticipating() || {};
            const entries = Object.entries(groups);
            if (!entries.length) return reply("Non sono in nessun gruppo.");

            let txt = `╭── ✦ *GRUPPI* (${entries.length}) ✦ ──╮\n│\n`;
            entries.forEach(([jid, g], i) => {
                const name = g.subject || 'N/A';
                const count = g.participants?.length || 0;
                const short = jid.split('@')[0];
                txt += `│ ${i+1}. ${name.slice(0, 20)}\n│    👥 ${count} | ${short}\n│\n`;
            });
            txt += `╰──────────────────────────────╯`;
            // Send in chunks if too long
            if (txt.length > 4000) {
                const chunks = txt.match(/.{1,4000}/g) || [txt];
                for (const chunk of chunks) await reply(chunk);
            } else {
                await reply(txt);
            }
        } catch (e) {
            await reply("❌ Errore nel recuperare la lista gruppi.");
        }
    },
};
