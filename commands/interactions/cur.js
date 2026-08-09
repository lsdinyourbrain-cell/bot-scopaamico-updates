'use strict';

// Mostra la canzone in riproduzione (o l'ultima ascoltata) dell'utente Last.fm.
// Per usarlo serve prima collegare il proprio account con: .lastfm <nomeutente>

module.exports = {
    name: 'cur',
    aliases: ['nowplaying', 'np'],
    description: "Mostra la canzone in riproduzione su Last.fm. Uso: .cur (tuo account) oppure .cur <nomeutente>. Collega prima l'account con .lastfm <nome>",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, isReply, contextInfo, mentioned, reply, services } = context;
        const { db, lastfm, showProgress } = services;

        if (!lastfm.isConfigured()) {
            return reply('⚠️ *Last.fm non configurato.*\n\nL\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).');
        }

        // Scelta dell'utente: argomento diretto > utente menzionato > account salvato
        let username = String(textArgs || '').trim();
        if (!username && mentioned && mentioned.length > 0) {
            const jid = mentioned[0];
            username = String((db._lastfm && db._lastfm[jid]) || '').trim();
            if (!username) return reply('❌ Questo utente non ha collegato un account Last.fm.\nDeve prima usare `.lastfm <nomeutente>`.');
        }
        if (!username) {
            username = String((db._lastfm && db._lastfm[sender]) || '').trim();
            if (!username) return reply('🎧 Nessun account Last.fm collegato.\n\nCollegalo con: `.lastfm <nomeutente>`\n\nEsempio: `.lastfm mia_musica`');
        }

        try {
            const prog = await showProgress(sock, from, { label: 'LAST.FM', duration: 2500, quoted: msg });
            const { nowPlaying, track } = await lastfm.getNowPlaying(username);

            if (!track) {
                return prog.done(`🎧 *${username}*\n\nNessuna traccia ascoltata di recente.`);
            }

            const status = nowPlaying ? '🎶 *IN RIPRODUZIONE*' : '🕓 *ULTIMO ASCOLTO*';
            const lines = [
                `🎧 ${status}`,
                '',
                `🎵 *${track.name}*`,
                `👤 ${track.artist}`,
            ];
            if (track.album) lines.push(`💿 ${track.album}`);
            if (track.url) lines.push(`🔗 ${track.url}`);
            lines.push('', `_Account: ${username}_`);

            await prog.done(lines.join('\n'));
        } catch (e) {
            const msgMap = {
                UTENTE_NON_TROVATO: '❌ Utente Last.fm non trovato. Controlla il nome.',
                API_KEY_INVALIDA: '❌ API key Last.fm non valida. Verifica config.js.',
                TROPPE_RICHIESTE: '⏳ Troppe richieste a Last.fm. Riprova tra poco.',
                API_ERROR: '❌ Errore di Last.fm. Riprova più tardi.',
                RETE: '❌ Non riesco a contattare Last.fm. Controlla la connessione.',
                API_KEY_MANCA: '⚠️ *Last.fm non configurato.*\n\nL\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).',
            };
            // Traduce anche gli errori grezzi di axios (caso "user not found"):
            // in certe versioni la chiamata fallisce con "Request failed with
            // status code 404" invece del codice mappato.
            const raw = String(e.message || '');
            let fallback;
            if (/404|not found|non trovato/i.test(raw)) {
                fallback = '❌ Utente Last.fm non trovato. Controlla il nome.';
            } else if (/403|invalid.*key|key.*invalid/i.test(raw)) {
                fallback = '❌ API key Last.fm non valida. Verifica config.js.';
            } else if (/timeout|timed out|ECONN|ENOTFOUND|network/i.test(raw)) {
                fallback = '❌ Non riesco a contattare Last.fm. Controlla la connessione.';
            } else {
                fallback = '❌ Errore imprevisto. Riprova più tardi.';
            }
            console.error('[cur] Errore:', e.message, e.stack || '');
            await reply(msgMap[e.message] || fallback);
        }
    },
};
