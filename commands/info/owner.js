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

        const txt = `🤖 *_VEX BOT_*\n━━━━━━━━━━━━━━━━━━\n▸ ✍️ Creato da:\n▸ 👑 _@${MAIN_OWNER_NUM}_\n▸ 📞 _${MAIN_OWNER_FORMATTED}_\n━━━━━━━━━━━━━━━━━━\n▸ 💬 Per assistenza scrivi\n  pure al creatore.\n━━━━━━━━━━━━━━━━━━\n◈ _Vex Bot_`;

        await sock.sendMessage(from, { text: txt, mentions: [MAIN_OWNER_JID] }).catch(() => {});
    },
};