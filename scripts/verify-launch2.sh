#!/bin/bash
pkill -f "Coal Trading ERP" 2>/dev/null || true
sleep 1
rm -f "$HOME/Library/Application Support/coal-trading-erp/startup.log"
APP="/Applications/Coal Trading ERP.app/Contents/MacOS/Coal Trading ERP"
"$APP" &
P1=$!
echo "launched P1=$P1"
for i in $(seq 1 30); do
  if [ -f "$HOME/Library/Application Support/coal-trading-erp/startup.log" ]; then
    echo "log appeared at ${i}s"
    cat "$HOME/Library/Application Support/coal-trading-erp/startup.log"
    break
  fi
  if ! kill -0 "$P1" 2>/dev/null; then
    echo "P1 exited at ${i}s"
    break
  fi
  sleep 1
done
echo "final ps:"
pgrep -fl "Coal Trading" || echo none
PORT=$(lsof -Pan -p "$P1" -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $9}' | sed 's/.*://')
echo "port=$PORT"
pkill -f "Coal Trading ERP" 2>/dev/null || true
