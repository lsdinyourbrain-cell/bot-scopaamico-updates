'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// Collega l'account Last.fm dell'utente al bot. Dopo questo comando, .cur
// mostrerà la canzone in riproduzione dell'utente. Il nome è validato
// chiamando l'API: se non esiste, non viene salvato.

module.exports = {
    name: 'lastfm',
    aliases: ['setfm', 'setlastfm'],
    description: "Collega il tuo account Last.fm al bot. Uso: .lastfm <nomeutente> (es. .lastfm mia_musica)",

    async run(sock, msg, args, context) {
        const { textArgs, sender, reply, services } = context;
        const { db, saveDB, lastfm } = services;

        if (!lastfm.isConfigured()) {
            return reply('⚠️ _Last.fm non configurato._\n▸ L\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).');
        }

        const username = String(textArgs || '').trim();
        if (!username) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: \\`.lastfm <nomeutente>\\`_ ▸ _Scrivi il nome utente Last.fm da collegar...')}
${boxEnd()}`);
        }

        // Scollegamento
        if (username.toLowerCase() === 'off') {
            if (db._lastfm && db._lastfm[sender]) {
                delete db._lastfm[sender];
                saveDB();
                return reply('👋 _Account Last.fm scollegato._');
            }
            return reply('ℹ️ _Non avevi nessun account Last.fm collegato._');
        }

        // Valida il nome sull'API prima di salvarlo
        try {
            const info = await lastfm.getUserInfo(username);
            if (!db._lastfm) db._lastfm = {};
            db._lastfm[sender] = info.name;
            saveDB();

            const playcount = info.playcount.toLocaleString('it-IT');
            return reply(
`✅ *_ACCOUNT COLLEGATO_*
▸ 👤 *Nome:* _${info.realName}_
▸ 🎧 *Ascolti totali:* _${playcount}_
▸ _Ora usa \`.cur\` per vedere la canzone in riproduzione._
`
            );
        } catch (e) {
            const msgMap = {
                UTENTE_NON_TROVATO: '⚠️ _Utente Last.fm non trovato. Controlla che il nome sia esatto._',
                API_KEY_INVALIDA: '⚠️ _API key Last.fm non valida. Verifica config.js._',
                TROPPE_RICHIESTE: '⚠️ _Troppe richieste a Last.fm. Riprova tra poco._',
                API_ERROR: '⚠️ _Errore di Last.fm. Riprova più tardi._',
                RETE: '⚠️ _Non riesco a contattare Last.fm. Controlla la connessione._',
                API_KEY_MANCA: '⚠️ _Last.fm non configurato._\n▸ L\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).',
            };
            // Traduce anche gli errori grezzi di axios (caso "user not found"):
            // in certe versioni la chiamata fallisce con "Request failed with
            // status code 404" invece del codice mappato.
            const raw = String(e.message || '');
            let fallback;
            if (/404|not found|non trovato/i.test(raw)) {
                fallback = '⚠️ _Utente Last.fm non trovato. Controlla che il nome sia esatto._';
            } else if (/403|invalid.*key|key.*invalid/i.test(raw)) {
                fallback = '⚠️ _API key Last.fm non valida. Verifica config.js._';
            } else if (/timeout|timed out|ECONN|ENOTFOUND|network/i.test(raw)) {
                fallback = '⚠️ _Non riesco a contattare Last.fm. Controlla la connessione._';
            } else {
                fallback = '⚠️ _Errore imprevisto. Riprova più tardi._';
            }
            console.error('[lastfm] Errore:', e.message, e.stack || '');
            await reply(msgMap[e.message] || fallback);
        }
    },
};
