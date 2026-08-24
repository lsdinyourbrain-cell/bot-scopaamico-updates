#!/data/data/com.termux/files/usr/bin/bash
# Vex Bot - start.sh con menu QR / Pairing Code + pulizia sessione
# Uso: bash start.sh

cd "$(dirname "$0")"

termux-wake-lock 2>/dev/null || true

show_menu() {
  clear 2>/dev/null || true
  echo "=============================================="
  echo "  Vex Bot - Menu Avvio"
  echo "=============================================="
  echo "  1) Avvia con QR CODE (scansiona da WhatsApp)"
  echo "  2) Avvia con CODICE PAIRING (inserisci numero)"
  echo "  3) Pulisci cartella sessione (auth_info_baileys)"
  echo "  4) Esci"
  echo "=============================================="
}

clean_auth() {
  echo ""
  echo "[*] Pulizia cartella auth_info_baileys..."
  if [ -d "auth_info_baileys" ]; then
    rm -rf "auth_info_baileys"
    echo "[✓] Cartella auth_info_baileys eliminata."
  else
    echo "[!] Nessuna cartella auth_info_baileys trovata."
  fi
  if [ -f ".auth_invalidated" ]; then rm -f ".auth_invalidated"; fi
  echo "[✓] Sessione pulita. Ora puoi riavviare con QR o codice."
  echo ""
  read -p "Premi INVIO per tornare al menu..." _
}

# Loop menu iniziale
while true; do
  show_menu
  read -p "Scelta [1-4]: " scelta
  case "$scelta" in
    1)
      MODE="qr"
      PAIRING_NUM=""
      break
      ;;
    2)
      echo ""
      read -p "Inserisci numero con prefisso internazionale (es. 393331234567, senza +): " PAIRING_NUM
      PAIRING_NUM=$(echo "$PAIRING_NUM" | tr -d ' +-' | tr -d '[:space:]')
      if [ -z "$PAIRING_NUM" ]; then
        echo "[!] Numero non valido."
        sleep 2
        continue
      fi
      MODE="pairing"
      break
      ;;
    3)
      clean_auth
      ;;
    4)
      echo "Uscita."
      exit 0
      ;;
    *)
      echo "[!] Scelta non valida."
      sleep 1
      ;;
  esac
done

echo ""
echo "=============================================="
if [ "$MODE" = "qr" ]; then
  echo "  Avvio in modalità QR CODE"
else
  echo "  Avvio in modalità PAIRING CODE ($PAIRING_NUM)"
fi
echo "  Ctrl+C per fermare"
echo "=============================================="

fast=0
while true; do
  start=$(date +%s)
  if [ "$MODE" = "pairing" ]; then
    # Passa il numero come env + arg per index.js
    PAIRING_NUMBER="$PAIRING_NUM" node index.js --pairing-code
  else
    node index.js
  fi
  code=$?
  end=$(date +%s)
  runtime=$((end - start))

  if [ "$runtime" -lt 30 ]; then
    fast=$((fast + 1))
  else
    fast=0
  fi

  echo "[start.sh] Bot terminato (exit $code, durata ${runtime}s)."

  if [ "$fast" -ge 5 ]; then
    echo "[start.sh] Troppi riavvii rapidi: attendo 60s..."
    sleep 60
    fast=0
  else
    echo "[start.sh] Riavvio tra 3 secondi... (Ctrl+C per uscire)"
    sleep 3
  fi
done
