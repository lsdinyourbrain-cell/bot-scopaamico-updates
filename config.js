'use strict';

const fs = require('fs');
const path = require('path');

// Carica .env subito così config è corretto anche se richiesto prima di index.js
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch (_) {}

const ROOT_DIR = __dirname;
const BOT_IDENTITY = 'Bot di +1(548)314-7193';
const SPONSOR_LINK = 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo';

const AI_API_KEY = (process.env.AI_API_KEY || '').trim();
const AI_API_URL = (process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions').trim();
const AI_MODEL   = (process.env.AI_MODEL   || 'openrouter/auto').trim();

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
    AI_API_KEY,
    AI_API_URL,
    AI_MODEL,
});
