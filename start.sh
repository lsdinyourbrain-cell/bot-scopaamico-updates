#!/data/data/com.termux/files/usr/bin/bash
# ScopaAmico Bot - avvio automatico con auto-restart
# Avvio: bash start.sh  (il bot riparte da solo dopo .aggiorna e dopo i crash)

cd "$(dirname "$0")"

# Mantiene la CPU attiva anche a schermo spento (serve Termux:API)
termux-wake-lock 2>/dev/null || true

echo "=============================================="
echo "  ScopaAmico Bot - avvio automatico"
echo "  Ctrl+C per fermare"
echo "=============================================="

fast=0

while true; do
  start=$(date +%s)
  node index.js
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
    echo "[start.sh] Troppi riavvii rapidi: possibile errore all'avvio. Attendo 60s..."
    sleep 60
    fast=0
  else
    echo "[start.sh] Riavvio tra 3 secondi..."
    sleep 3
  fi
done
