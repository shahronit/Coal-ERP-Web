#!/bin/bash
set -u
pkill -f "Coal Trading ERP" 2>/dev/null || true
sleep 1

APP="/Applications/Coal Trading ERP.app/Contents/MacOS/Coal Trading ERP"
"$APP" &
PID=$!
echo "started pid=$PID"

for i in $(seq 1 25); do
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "exit at ${i}s"
    exit 1
  fi
  PORT=$(lsof -Pan -p "$PID" -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $9}' | sed 's/.*://')
  CHILD=$(pgrep -P "$PID" | wc -l | tr -d ' ')
  echo "${i}s alive children=$CHILD port=${PORT:-none}"
  if [ -n "$PORT" ]; then
    echo "SUCCESS port=$PORT"
    curl -s -o /dev/null -w "root HTTP %{http_code}\n" "http://127.0.0.1:$PORT/"
    curl -s -X POST "http://127.0.0.1:$PORT/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"ronit.shah2010@gmail.com","password":"Demo@123"}' | head -c 300
    echo
    exit 0
  fi
  sleep 1
done

echo "TIMEOUT"
kill "$PID" 2>/dev/null || true
lsof -p "$PID" 2>/dev/null | head -20
exit 1
