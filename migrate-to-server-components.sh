#!/bin/bash

echo "🚀 Migrating to Server Components..."

# Step 1: Backup old intake page
echo "📦 Backing up old intake page..."
mv app/\(pages\)/intake/page.tsx app/\(pages\)/intake/page-old-zustand.tsx 2>/dev/null || true

# Step 2: Use new server component page
echo "✅ Activating new server component page..."
mv app/\(pages\)/intake/page-server.tsx app/\(pages\)/intake/page.tsx 2>/dev/null || true

echo "✅ Migration script complete!"
echo ""
echo "Next steps:"
echo "1. Check that IntakeClient.tsx has complete form JSX"
echo "2. Test the intake page"
echo "3. Migrate other pages (jobs, jig, dispatch)"
echo "4. Remove Zustand after all pages migrated"

