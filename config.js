'use strict';

const path = require('path');

const ROOT_DIR = __dirname;
const BOT_IDENTITY = 'Bot di +1(548)314-7193';
const SPONSOR_LINK = 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo';

// API key per Last.fm (gratuita: https://www.last.fm/api/account/create).
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || '0370eb25664f53ae121328eb3c6b5f16';
// Shared secret (serve solo per richieste autenticate, es. scrobbling).
const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET || '21ae56bf15b76a0309cd3dbc41059571';

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
    LASTFM_API_KEY,
    LASTFM_API_SECRET,
});
