#!/bin/sh
set -e
echo "Pushing database schema..."
npx prisma db push --accept-data-loss
echo "Starting Lumni API..."
exec node dist/main.js
