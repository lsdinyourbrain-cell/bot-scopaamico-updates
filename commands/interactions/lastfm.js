'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

// Collega l'account Last.fm dell'utente al bot. Dopo questo comando, .cur
// mostrerà la canzone in riproduzione dell'utente. Il nome è validato
// chiamando l'API: se non esiste, non viene salvato.

module.exports = {
    name: 'lastfm',
    aliases: ['setfm', 'setlastfm', 'fm'],
    description: "Collega il tuo account Last.fm al bot. Uso: .lastfm <nomeutente> (es. .lastfm mia_musica) — .lastfm senza args mostra il tuo profilo",

    async run(sock, msg, args, context) {
        const { textArgs, sender, pushName, isGroup, reply, services } = context;
        const { lastfm, axios, sharp } = services || {};
        const db = services?.db || context?.services?.db || {};
        const saveDB = services?.saveDB || (()=>{});

        if (!lastfm.isConfigured()) {
            return reply('⚠️ _Last.fm non configurato._\n▸ L\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).');
        }

        const raw = String(textArgs || '').trim();
        const lower = raw.toLowerCase();

        // ── PROFILO: mostra il tuo profilo o quello taggato ─────────────────
        const isProfileCmd = !raw || ['profilo','profile','me','io','mio','my'].includes(lower) || lower.startsWith('profilo ') || lower.startsWith('profile ');
        const mentionedJid = context.mentioned && context.mentioned[0] ? context.mentioned[0] : null;
        const wantsProfile = isProfileCmd || !!mentionedJid || lower.startsWith('@');

        if (wantsProfile) {
            let targetUsername = null;
            let targetJid = sender;
            if (mentionedJid) {
                targetUsername = (db && db._lastfm && db._lastfm[mentionedJid]) || null;
                targetJid = mentionedJid;
                if (!targetUsername) {
                    return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Questo utente non ha collegato Last.fm.')}\n${boxEnd()}`);
                }
            } else if (!raw || ['profilo','profile','me','io','mio','my'].includes(lower)) {
                targetUsername = (db && db._lastfm && db._lastfm[sender]) || null;
                if (!targetUsername) {
                    return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Non hai ancora collegato Last.fm.')}\n${line('Usa: .lastfm <nomeutente>')}\n${boxEnd()}`);
                }
            } else if (lower.startsWith('profilo ') || lower.startsWith('profile ')) {
                const name = raw.split(/\s+/).slice(1).join(' ').trim();
                if (!name) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Uso: .lastfm profilo <nome>')}\n${boxEnd()}`);
                targetUsername = name;
            }
            if (targetUsername) {
                try {
                    const info = await lastfm.getUserInfo(targetUsername);
                    let avatarBuf = null;
                    try {
                        // prova a prendere immagine utente da Last.fm se disponibile, altrimenti usa pfp Telegram/WhatsApp
                        const imgUrl = info.url ? null : null;
                        if (targetJid) {
                            try { const purl = await sock.profilePictureUrl(targetJid, 'image'); if(purl){ const r=await axios.get(purl,{responseType:'arraybuffer',timeout:8000}); avatarBuf=Buffer.from(r.data); } } catch(_){}
                        }
                    } catch(_){}
                    const { renderProfileCard } = require('../../lib/lastfmCard');
                    const card = await renderProfileCard(sharp, {
                        username: info.name,
                        realName: info.realName,
                        playcount: info.playcount,
                        registered: info.registered,
                        url: info.url,
                        avatarBuffer: avatarBuf
                    });
                    if (card) {
                        await sock.sendMessage(context.from, { image: card, caption: `🔗 ${info.url}` }, { quoted: msg });
                        return;
                    }
                    return reply(`${sec('PROFILO LAST.FM')}\n${boxOpen()}\n${line(`👤 ${info.name} — ${info.realName}`)}\n${line(`🎧 ${info.playcount.toLocaleString('it-IT')} ascolti`)}\n${line(`📅 Dal ${new Date(info.registered*1000).toLocaleDateString('it-IT')}`)}\n${line(`🔗 ${info.url}`)}\n${boxEnd()}`);
                } catch(e){
                    return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Profilo non trovato: '+ (e.message||''))}\n${boxEnd()}`);
                }
            }
            // se wantsProfile era true ma non abbiamo risolto targetUsername, continua verso link flow se raw non vuoto
            if (!raw) {
                return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Uso: .lastfm <nomeutente> per collegare')}\n${line('oppure .lastfm per vedere il tuo profilo')}\n${boxEnd()}`);
            }
        }

        const linkUsername = String(textArgs || '').trim();
        if (!linkUsername) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: \\`.lastfm <nomeutente>\\`_ ▸ _Scrivi il nome utente Last.fm da collegar...')}
${boxEnd()}`);
        }

        // Scollegamento
        if (linkUsername.toLowerCase() === 'off') {
            if (db && db._lastfm && db._lastfm[sender]) {
                delete db._lastfm[sender];
                try{ saveDB(); }catch(_){}
                return reply('👋 _Account Last.fm scollegato._');
            }
            return reply('ℹ️ _Non avevi nessun account Last.fm collegato._');
        }

        // Valida il nome sull'API prima di salvarlo
        try {
            const info = await lastfm.getUserInfo(linkUsername);
            if (!db) return reply('⚠️ DB non disponibile');
            if (!db._lastfm) db._lastfm = {};
            db._lastfm[sender] = info.name;
            try{ saveDB(); }catch(_){}

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
