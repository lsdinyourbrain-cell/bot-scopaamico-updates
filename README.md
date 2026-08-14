# Vex Bot — versione Termux (Android)

Bot compatibile con Termux. Usa ffmpeg e yt-dlp di sistema invece dei binari bundleati (ffmpeg-static / youtube-dl-exec), che non girano su Android.

## Requisiti

- Termux installato da F-Droid (NON dal Play Store, è obsoleto)
- `pkg install -y nodejs ffmpeg yt-dlp git binutils build-essential python`

## Installazione

```bash
git clone https://github.com/lsdinyourbrain-cell/bot-scopaamico-updates.git
cd bot-scopaamico-updates
bash setup-termux.sh
```

oppure a mano:

```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs ffmpeg yt-dlp git binutils build-essential python
npm install --legacy-peer-deps
```

## Avvio (con auto-riavvio)

```bash
bash start.sh
```

Il bot parte con `termux-wake-lock` (CPU attiva a schermo spento, serve Termux:API)
e **si riavvia da solo**: dopo `.aggiorna` e dopo eventuali crash. Non serve più
andare a mano su Termux.

Vedrai il QR code nel terminale: inquadralo su WhatsApp → Dispositivi collegati → Collega un dispositivo.

La sessione viene salvata in `auth_info_baileys` e non dovrai ri-accedere finché non la cancelli.

## Aggiornamenti dal gruppo

Quando modifichi il codice sul PC, pusha la cartella sul repo:
`https://github.com/lsdinyourbrain-cell/bot-scopaamico-updates`

Poi dal gruppo WhatsApp scrivi `.aggiorna` (solo Owner):

1. il bot controlla su GitHub se c'è una versione nuova;
2. se sì, invia la lista delle modifiche, scarica i file, installa le dipendenze se serve;
3. si **riavvia da solo** (start.sh) e conferma il riavvio nel gruppo;
4. se sei già aggiornato, risponde "Sei già aggiornato!".

### Se hai già una cartella del bot (non clonata dal repo)

```bash
cd ~/bot-scopaamico-termux
git init
git remote add origin https://github.com/lsdinyourbrain-cell/bot-scopaamico-updates.git
git fetch origin master
git reset --hard origin/master
```

La sessione (`auth_info_baileys`) e `database.json` NON vengono toccati.

## Configurazione

- **Numero proprietario**: modifica `ownerNumber` in `index.js` (di default `"269956662956146@lid"`).
- **GIST_TOKEN**: esporta la variabile se vuoi il backup della sessione e del database su Gist:
  ```bash
  export GIST_TOKEN="ghp_..."
  export GIST_ID="92025e52f28e241cab9217531fd73b3f"
  ```
- **AI_API_KEY**: serve per i comandi AI (chiave di Google AI Studio).

## Note

- Il backup su Gist è limitato a 1 upload/minuto per evitare il rate-limit di GitHub.
- `sharp` (usato da `.wasted`, `.rubato`, `.pokedex`, `.clown`) a volte richiede compilazione: se `npm install` fallisce su sharp, rimuovilo da `package.json` oppure segui le istruzioni in `setup-termux.sh`.
- I comandi media (`.8d`, `.bass`, `.nightcore`, ...) richiedono `ffmpeg` di sistema (già installato dallo script).
- I download (`.yt`/media) richiedono `yt-dlp` di sistema (già installato dallo script).
