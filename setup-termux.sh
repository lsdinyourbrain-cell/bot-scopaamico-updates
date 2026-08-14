#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "=============================================="
echo "  Setup Vex Bot per Termux (Android)"
echo "=============================================="

echo "[1/4] Aggiornamento pacchetti..."
pkg update -y
pkg upgrade -y

echo "[2/4] Installazione dipendenze di sistema..."
pkg install -y nodejs ffmpeg yt-dlp git

# Build essentials solo se serve compilare moduli nativi (es. sharp)
echo "[3/4] Installazione toolchain (per moduli nativi)..."
pkg install -y binutils build-essential python

echo "[4/4] Installazione dipendenze npm..."
npm install --legacy-peer-deps || {
    echo
    echo "ATTENZIONE: npm install fallito."
    echo "Se il problema e' sharp, prova:"
    echo "  pkg install -y pkg-config libjpeg-turbo zlib"
    echo "  npm install sharp --build-from-source"
    echo "oppure rimuovi sharp da package.json se i comandi"
    echo "wasted/rubato/pokedex/clown non ti servono."
    exit 1
}

echo
echo "=============================================="
echo "  Installazione completata!"
echo "=============================================="
echo
echo "Per avviare il bot:"
echo "  npm start"
echo
echo "Il QR code appare nel terminale: inquadralo su WhatsApp"
echo "-> Dispositivi collegati -> Collega un dispositivo."
