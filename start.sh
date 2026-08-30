#!/data/data/com.termux/files/usr/bin/bash
# Vex Bot - start.sh con menu QR / Pairing Code + pulizia sessione
# Uso: bash start.sh

cd "$(dirname "$0")"

termux-wake-lock 2>/dev/null || true

# ── RILEVA SESSIONE ATTIVA ──────────────────────────────────────────────
is_session_active() {
  # Controlla .bot.pid e se il processo è vivo
  if [ -f ".bot.pid" ]; then
    pid=$(cat ".bot.pid" 2>/dev/null | tr -d ' \n')
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    # pid file stantio
    rm -f ".bot.pid" 2>/dev/null || true
  fi
  # Fallback: cerca node index.js attivo
  if pgrep -f "node.*index\.js" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

has_valid_creds() {
  [ -f "auth_info_baileys/creds.json" ] && [ -s "auth_info_baileys/creds.json" ]
}

if is_session_active; then
  echo "=============================================="
  echo "  Vex Bot - Sessione già attiva!"
  echo "=============================================="
  if [ -f ".bot.pid" ]; then echo "  PID: $(cat .bot.pid)"; fi
  echo "  Il bot è già in esecuzione."
  echo "  Vuoi riutilizzarla o riavviare?"
  echo "  1) Usa sessione attiva (non avvio nuovo)"
  echo "  2) Riavvia comunque"
  echo "  3) Pulisci sessione e riparti da zero"
  echo "=============================================="
  read -p "Scelta [1-3] (default 1): " _sc
  _sc=${_sc:-1}
  case "$_sc" in
    1) echo "[✓] Uso sessione attiva. Esco."; exit 0 ;;
    3) echo "[*] Pulisco..."; rm -rf "auth_info_baileys" 2>/dev/null; rm -f ".bot.pid" ".auth_invalidated" 2>/dev/null; echo "[✓] Pulita." ;;
    *) echo "[*] Riavvio..."; pkill -f "node.*index\.js" 2>/dev/null || true; rm -f ".bot.pid" 2>/dev/null; sleep 2 ;;
  esac
fi

# Se creds valide, avvia diretto senza menu (auto-riuso sessione funzionante)
if has_valid_creds && [ ! -f ".auth_invalidated" ]; then
  echo "=============================================="
  echo "  Vex Bot - Sessione trovata, avvio diretto..."
  echo "  Creds: auth_info_baileys/creds.json"
  echo "  (Ctrl+C per menu)"
  echo "=============================================="
  # Dai 3s per annullare e andare al menu
  for i in 3 2 1; do echo -n "  Avvio tra $i... "; sleep 1; echo ""; done
  # Se l'utente preme Ctrl+C qui, va al menu; altrimenti avvia
  MODE="auto"
  PAIRING_NUM=""
  # Salta il menu e vai diretto al loop
  goto_loop=true
else
  goto_loop=false
fi

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

# Loop menu iniziale — salta se auto-avvio con creds valide
if [ "$goto_loop" = "true" ]; then
  MODE="qr"
  PAIRING_NUM=""
  echo "[auto] Avvio diretto con sessione esistente..."
else
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
fi

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
