#!/bin/sh
set -e

cd /app/backend

if [ "$DATABASE_PROVIDER" = "firestore" ]; then
  echo "Firestore provider — skipping Prisma migrations"
else
  if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_PROVIDER=postgres but DATABASE_URL is not set"
    exit 1
  fi
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
fi

exec node src/server.js
