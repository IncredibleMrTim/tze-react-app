#!/bin/bash
# Script to resolve failed migration on Vercel database

echo "Resolving failed migration on Vercel database..."

# Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back "20260713204635_rename_parts_photos_to_parts_on_arrival_photos"

echo "Failed migration marked as rolled back"
echo "Now deploying migrations..."

# Deploy all migrations
npx prisma migrate deploy

echo "Migrations deployed successfully!"
