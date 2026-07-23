#!/usr/bin/env bash
set -euo pipefail
APP_DIR=${APP_DIR:-/var/www/imparoutfit}
NODE_VERSION=${NODE_VERSION:-20}
echo "Installing runtime packages (Node ${NODE_VERSION}, PostgreSQL client, Redis, PM2, Nginx expected on VPS)..."
mkdir -p "$APP_DIR"
rsync -av --exclude node_modules --exclude .git ./ "$APP_DIR/"
cd "$APP_DIR/backend"
npm ci --omit=dev
psql "$DATABASE_URL" -f sql/001_schema.sql
pm2 start src/server.js --name imparoutfit-api --update-env
pm2 save
echo "Configure Nginx reverse proxy to http://127.0.0.1:${PORT:-4000} and enable TLS with certbot."
