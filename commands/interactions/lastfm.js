'use strict';

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
            return reply('⚠️ *Last.fm non configurato.*\n\nL\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).');
        }

        const username = String(textArgs || '').trim();
        if (!username) {
            return reply('⚠️ Scrivi il nome utente Last.fm da collegare.\n👉 *Uso:* `.lastfm <nomeutente>`\n\nEsempio: `.lastfm mia_musica`\n\nPer scollegare: `.lastfm off`');
        }

        // Scollegamento
        if (username.toLowerCase() === 'off') {
            if (db._lastfm && db._lastfm[sender]) {
                delete db._lastfm[sender];
                saveDB();
                return reply('👋 Account Last.fm scollegato.');
            }
            return reply('ℹ️ Non avevi nessun account Last.fm collegato.');
        }

        // Valida il nome sull'API prima di salvarlo
        try {
            const info = await lastfm.getUserInfo(username);
            if (!db._lastfm) db._lastfm = {};
            db._lastfm[sender] = info.name;
            saveDB();

            const playcount = info.playcount.toLocaleString('it-IT');
            return reply(
`✅ *Account Last.fm collegato!*

👤 *${info.realName}*
🎧 ${playcount} ascolti totali

Ora usa `.cur` per vedere la canzone in riproduzione.`
            );
        } catch (e) {
            const msgMap = {
                UTENTE_NON_TROVATO: '❌ Utente Last.fm non trovato. Controlla che il nome sia esatto.',
                API_KEY_INVALIDA: '❌ API key Last.fm non valida. Verifica config.js.',
                TROPPE_RICHIESTE: '⏳ Troppe richieste a Last.fm. Riprova tra poco.',
                API_ERROR: '❌ Errore di Last.fm. Riprova più tardi.',
                RETE: '❌ Non riesco a contattare Last.fm. Controlla la connessione.',
                API_KEY_MANCA: '⚠️ *Last.fm non configurato.*\n\nL\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).',
            };
            await reply(msgMap[e.message] || '❌ Errore imprevisto. Riprova più tardi.');
        }
    },
};
