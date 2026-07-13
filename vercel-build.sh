#!/bin/bash
set -e

echo "Resolving any failed migrations..."
npx prisma migrate resolve --rolled-back "20260713204635_rename_parts_photos_to_parts_on_arrival_photos" || echo "No failed migration to resolve"

echo "Deploying migrations..."
npx prisma migrate deploy

echo "Building application..."
npm run build
