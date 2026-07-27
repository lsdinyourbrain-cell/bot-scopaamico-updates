'use strict';

const path = require('path');

const ROOT_DIR = __dirname;
const BOT_IDENTITY = 'Bot di +1(548)314-7193';
const SPONSOR_LINK = 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo';

module.exports = Object.freeze({
    ROOT_DIR,
    BOT_IDENTITY,
    SYSTEM_FOOTER: `— ${BOT_IDENTITY}`,
    AUTH_DIR: path.join(ROOT_DIR, 'auth_info_baileys'),
    AUDIO_DIR: path.join(ROOT_DIR, 'audio'),
    COMMANDS_DIR: path.join(ROOT_DIR, 'commands'),
    STICKER_PACK_NAME: 'Sticker by: +1(548)314-7193',
    STICKER_AUTHOR: BOT_IDENTITY,
    STICKER_PACK_ID: 'bot.whatsapp.15483147193',
    SPONSOR_LINK,
});
