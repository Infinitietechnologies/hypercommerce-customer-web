#!/bin/bash
set -e

cd /www/wwwroot/hypercommerce-web.infinitietech.in

echo ">>> Pulling latest code..."
git pull origin dev

echo ">>> Installing dependencies..."
npm install

echo ">>> Building project..."
npm run build

echo ">>> Restarting PM2..."
pm2 restart hypercommerce

echo ">>> Deploy finished successfully!"
