# Vex Bot — Dashboard Locale

Dashboard web locale per gestire il bot senza esporre nulla online.

## Avvio

```bash
npm run dashboard
# oppure
node dashboard/server.js
```

Apri: **http://127.0.0.1:3001** (solo localhost, non in rete)

Se la porta 3001 è occupata, prova automaticamente 3002, 3003...

Oppure usa porta custom:
```bash
DASHBOARD_PORT=8080 node dashboard/server.js
```

## Cosa puoi fare

- **Overview** — uptime, gruppi, utenti, frasi, sistema
- **Gruppi** — lista, cerca, dettaglio per gruppo:
  - Welcome/Goodbye on/off + frase custom con placeholder `@user @group @desc`
  - Antilink per piattaforma (whatsapp, instagram, telegram, tiktok, facebook, youtube, twitter, altri) + whitelist
  - Impostazioni: `.link` aperto, modoadmin, antiflood
  - Lista utenti del gruppo (top 30) e link a gestione utenti
  - Elimina gruppo (pulisce database.json + welcome.json + antilink.json)
- **Utenti** — seleziona gruppo, cerca JID, modifica money/warnings/isMuted/bio/nickname, elimina
- **Frasi** — lista `phrases/*.txt`, editor con aggiungi/rimuovi/modifica, salva file (una riga = una frase, `#` commenti ignorati)
- **Owner** — aggiungi/rimuovi owner (salvato in `database.json → _owners`)
- **Config** — vista `config.js` (BOT_IDENTITY, SPONSOR_LINK) e link a API raw
- **Logs** — `logs/bot.log` con selezione righe

## File gestiti

- `database.json` — utenti, gruppi, owners, economy
- `welcome.json` — welcome/goodbye per gruppo (con custom text)
- `antilink.json` — filtri per gruppo
- `phrases/*.txt` — frasi per comando
- `config.js` — identità bot (sola lettura qui)
- `logs/bot.log` — logs

Tutte le scritture sono atomiche (tmp + rename) e validate.

## Sicurezza

Solo `127.0.0.1` — non esposto in rete. Nessun auth, ma solo chi ha accesso al PC può aprirlo.

## API

Tutte sotto `/api/*` — vedi `dashboard/server.js` per lista completa.
