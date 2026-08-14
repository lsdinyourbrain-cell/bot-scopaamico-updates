'use strict';

module.exports = {
    name: 'welcome',
    aliases: ['benvenuto'],
    description: "Attiva/disattiva il messaggio di benvenuto nel gruppo (solo owner).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { getWelcomeGroup, setWelcomeGroup, sameJid } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");
        if (!isOwner) return reply("⚠️ _[uso]:_ solo l'owner del bot può modificare questa impostazione.");

        const config = getWelcomeGroup(from);
        const arg = textArgs.toLowerCase().trim();

        if (!arg || (arg !== 'on' && arg !== 'off' && arg !== 'true' && arg !== 'false' && arg !== 'si' && arg !== 'no' && arg !== 'attivo' && arg !== 'disattivo')) {
            const status = config.welcome ? '🟢 ATTIVO' : '🔴 DISATTIVO';
            return reply(
`🎉 *BENVENUTO GRUPPO*
━━━━━━━━━━━━━━
Stato attuale: ${status}
Uso: .welcome <on|off>
Es: .welcome on
━━━━━━━━━━━━━━`
            );
        }

        const enable = ['on', 'true', 'si', 'attivo'].includes(arg);
        setWelcomeGroup(from, 'welcome', enable);

        await reply(
`🎉 *BENVENUTO ${enable ? 'ATTIVATO' : 'DISATTIVATO'}*
━━━━━━━━━━━━━━
Il messaggio di benvenuto è ora
${enable ? '🟢 ATTIVO' : '🔴 DISATTIVATO'}
in questo gruppo.
━━━━━━━━━━━━━━`
        );
    },
};