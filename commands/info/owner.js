'use strict';

module.exports = {
    name: 'owner',
    aliases: ['creator', 'creatore', 'sviluppatore', 'dev'],
    description: "Mostra le informazioni sul creatore del bot.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;

        const MAIN_OWNER_NUM = '15483147193';
        const MAIN_OWNER_JID = `${MAIN_OWNER_NUM}@s.whatsapp.net`;
        const MAIN_OWNER_FORMATTED = '+1 (548) 314-7193';

        const txt = `🤖 *ScopaAmico Bot*\n\n✍️ Creato da:\n👑 *@${MAIN_OWNER_NUM}*\n📞 ${MAIN_OWNER_FORMATTED}\n\n💬 Per assistenza scrivi pure al creatore.`;

        await sock.sendMessage(from, { text: txt, mentions: [MAIN_OWNER_JID] }).catch(() => {});
    },
};