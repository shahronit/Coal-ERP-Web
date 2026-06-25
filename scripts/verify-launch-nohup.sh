#!/bin/bash
set -u
pkill -9 -f "Coal Trading ERP" 2>/dev/null || true
sleep 1
rm -f /tmp/tradecrm-bootstrap.log "$HOME/Library/Application Support/coal-trading-erp/startup.log"
rm -rf "/Applications/Coal Trading ERP.app"
cp -R "/Users/ronitshah/Projects/tradecrm-pro/dist-desktop/mac-arm64/Coal Trading ERP.app" /Applications/

nohup "/Applications/Coal Trading ERP.app/Contents/MacOS/Coal Trading ERP" >/tmp/tcrm-nohup.log 2>&1 &
PID=$!
echo "launched pid=$PID"

for i in $(seq 1 45); do
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "exited at ${i}s"
    break
  fi
  PORT=$(lsof -Pan -p "$PID" -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $9}' | sed 's/.*://')
  if [ -n "$PORT" ]; then
    echo "SUCCESS at ${i}s port=$PORT"
    curl -s -o /dev/null -w "root HTTP %{http_code}\n" "http://127.0.0.1:$PORT/"
    curl -s -X POST "http://127.0.0.1:$PORT/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"ronit.shah2010@gmail.com","password":"Demo@123"}' | head -c 120
    echo
    echo "=== bootstrap ==="
    cat /tmp/tradecrm-bootstrap.log 2>&1 || true
    echo "=== startup log ==="
    cat "$HOME/Library/Application Support/coal-trading-erp/startup.log" 2>&1 || true
    exit 0
  fi
  sleep 1
done

echo "TIMEOUT or FAIL"
echo "=== bootstrap ==="
cat /tmp/tradecrm-bootstrap.log 2>&1 || true
echo "=== startup log ==="
cat "$HOME/Library/Application Support/coal-trading-erp/startup.log" 2>&1 || true
echo "=== nohup ==="
cat /tmp/tcrm-nohup.log 2>&1 || true
kill "$PID" 2>/dev/null || true
exit 1
