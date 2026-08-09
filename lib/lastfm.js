'use strict';

const axios = require('axios');

// Servizio Last.fm: wrapper pulito per l'API pubblica (ws.audioscrobbler.com).
// Tutte le funzioni ritornano oggetti già "puliti" (campi sicuri) e lanciano
// errori con messaggi leggibili dall'utente (niente stack trace in chat).
//
// Serve una API key Last.fm. Mettila in config.js -> LASTFM_API_KEY
// (oppure come variabile d'ambiente LASTFM_API_KEY prima di avviare il bot).

const API_BASE = 'https://ws.audioscrobbler.com/2.0/';
const TIMEOUT = 12000;

let apiKey = null;

const setApiKey = (key) => {
    apiKey = (key || '').trim();
};

const isConfigured = () => Boolean(apiKey);

// Chiamata base: aggiunge api_key + format=json, e traduce gli errori noti
// dell'API in messaggi per l'utente.
const call = async (method, params) => {
    if (!isConfigured()) {
        throw new Error('API_KEY_MANCA');
    }
    let resp;
    try {
        // validateStatus: () => true — Last.fm risponde con status non-2xx
        // (404 user not found, 403 key invalida) MA con un corpo JSON che
        // contiene il codice errore. Se axios lancia per lo status, non
        // riusciamo a leggerlo e l'utente vede un generico "errore".
        resp = await axios.get(API_BASE, {
            params: { method, api_key: apiKey, format: 'json', ...params },
            timeout: TIMEOUT,
            validateStatus: () => true,
        });
    } catch (e) {
        throw new Error('RETE');
    }

    const data = resp?.data;
    if (!data) throw new Error('RETE');

    if (data.error) {
        switch (data.error) {
            case 6: throw new Error('UTENTE_NON_TROVATO');
            case 10: throw new Error('API_KEY_INVALIDA');
            case 11: throw new Error('TROPPE_RICHIESTE');
            default: throw new Error('API_ERROR');
        }
    }
    return data;
};

// Valida un nome utente: ritorna info pubbliche del profilo.
// { name, realName, playcount, registered, url }
const getUserInfo = async (username) => {
    const data = await call('user.getinfo', { user: username });
    const u = data?.user;
    if (!u) throw new Error('UTENTE_NON_TROVATO');
    return {
        name: String(u.name || username),
        realName: String(u.realname || u.name || username),
        playcount: Number(u.playcount) || 0,
        registered: Number(u.registered?.['#text'] || u.registered?.unixtime) || 0,
        url: String(u.url || ''),
    };
};

// Ultima traccia ascoltata (o in riproduzione).
// { nowPlaying, track: { name, artist, album, url, cover }, }
// "cover" è l'URL dell'immagine album più grande disponibile (o null).
const getNowPlaying = async (username) => {
    const data = await call('user.getrecenttracks', { user: username, limit: 1, extended: 1 });
    const tracks = data?.recenttracks?.track;
    const first = Array.isArray(tracks) ? tracks[0] : (tracks || null);
    if (!first) {
        return { nowPlaying: false, track: null };
    }
    const nowPlaying = first['@attr']?.nowplaying === 'true';
    // Last.fm fornisce un array "image" con più risoluzioni (small→mega).
    // Preferiamo la più alta disponibile: extralarge > large > medium.
    const imageArr = Array.isArray(first.image) ? first.image : [];
    let cover = null;
    for (const size of ['extralarge', 'large', 'medium']) {
        const found = imageArr.find((i) => i?.size === size && i?.['#text']);
        if (found) { cover = found['#text']; break; }
    }
    return {
        nowPlaying,
        track: {
            name: String(first.name || 'Sconosciuta'),
            artist: String(first.artist?.['#text'] || first.artist?.name || first.artist || 'Sconosciuto'),
            album: String(first.album?.['#text'] || first.album?.name || ''),
            url: String(first.url || ''),
            cover,
        },
    };
};

// Info globali di una trascia: ascolti mondiali, ascoltatori, ascolti dell'utente.
// artist e track sono i nomi. username serve per userplaycount.
// Ritorna { playcount, listeners, userplaycount } (numeri, 0 se assenti).
const getTrackInfo = async (artist, track, username) => {
    const params = { artist, track, autocorrect: 1 };
    if (username) params.username = username;
    const data = await call('track.getinfo', params);
    const t = data?.track;
    if (!t) return { playcount: 0, listeners: 0, userplaycount: 0 };
    return {
        playcount: Number(t.playcount) || 0,
        listeners: Number(t.listeners) || 0,
        userplaycount: Number(t.userplaycount) || 0,
    };
};

module.exports = { setApiKey, isConfigured, getUserInfo, getNowPlaying, getTrackInfo };
