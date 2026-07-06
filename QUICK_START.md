# Quick Start - Database Setup

## What's Been Done

Your app now has full PostgreSQL + Prisma integration! Here's what's set up:

### 1. Database Schema
- **Items**: Product catalog (code, desc, price, customer)
- **Contacts**: Customer database (name, account, email, aliases)
- **Jobs**: Full PO/job tracking with all fields
- **JigAssignments**: Jig tracking and assignments
- **Settings**: App settings persistence
- **JigPhotos**: Photo storage for jigs

### 2. Files Added
```
prisma/
  ├── schema.prisma          # Database schema
  └── seed.ts                # Data seeding script

app/
  ├── lib/
  │   ├── prisma.ts          # Prisma client setup
  │   └── db.ts              # Database utility functions
  ├── api/                   # API routes for CRUD operations
  │   ├── jobs/
  │   ├── jigs/
  │   ├── items/
  │   ├── contacts/
  │   └── settings/
  ├── hooks/
  │   └── useDbSync.ts       # Database sync hook
  └── components/
      └── DbInit.tsx         # Auto-load data on startup

DATABASE_SETUP.md              # Detailed setup guide
```

### 3. Store Updates
Your Zustand store now automatically syncs to the database:
- Creating/updating/deleting jobs → saves to DB
- Jig assignments → saves to DB  
- Settings changes → saves to DB
- On app startup → loads from DB

## Setup Steps

### Step 1: Get PostgreSQL
You need a PostgreSQL database. Choose one:

**A) Local (easiest for dev)**
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb tze_db
```

**B) Docker**
```bash
docker run --name tze-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=tze_db \
  -p 5432:5432 \
  -d postgres:16
```

**C) Cloud (recommended for production)**
- [Supabase](https://supabase.com) - free tier
- [Neon](https://neon.tech) - free tier
- [Railway](https://railway.app)

### Step 2: Configure Connection
Edit `.env` and update the `DATABASE_URL`:

```env
# Local example:
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/tze_db?schema=public"

# Supabase example:
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

### Step 3: Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Create tables
npm run db:push

# Import your existing data (items + contacts)
npm run db:seed
```

### Step 4: Start App
```bash
npm run dev
```

The app will automatically:
- Load all data from the database on startup
- Save all changes back to the database
- Keep data persistent across sessions

## Verify It's Working

1. Open [http://localhost:3000](http://localhost:3000)
2. Create a new job
3. Close the app (Ctrl+C)
4. Restart: `npm run dev`
5. Your job should still be there!

You can also view your data:
```bash
npm run db:studio
```
Opens a GUI at [http://localhost:5555](http://localhost:5555)

## What Changed

### Before
- Data stored in browser localStorage
- Data lost if localStorage cleared
- No multi-device sync
- Limited search capabilities

### After
- Data stored in PostgreSQL database
- Persists indefinitely
- Can access from multiple devices/browsers
- Full database search and queries
- Easy backups

### Compatibility
- Your existing Zustand store API remains unchanged
- All existing components work as-is
- localStorage persistence still works as a cache
- Database sync happens automatically in the background

## Data Migration

Your old localStorage data won't be automatically migrated. If you have important jobs in localStorage:

1. Open browser DevTools → Application → Local Storage
2. Find `tze-storage` key
3. Copy the job data
4. Manually re-create jobs in the new system, or
5. Clear localStorage: `localStorage.clear()` in console

## Troubleshooting

**"Can't reach database server"**
- Make sure PostgreSQL is running
- Check your DATABASE_URL in `.env`
- Verify port 5432 is open

**"relation does not exist"**
- Run: `npm run db:push`
- This creates the database tables

**"No data showing"**
- Run: `npm run db:seed`
- This imports items and contacts

**Start fresh**
```bash
npm run db:push -- --force-reset
npm run db:seed
```

## Next Steps

See `DATABASE_SETUP.md` for detailed documentation including:
- Advanced configuration
- Cloud hosting setup
- Database migrations
- Backup strategies
- Performance tuning

## Commands Cheat Sheet

```bash
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database (no migrations)
npm run db:migrate      # Create and run migrations
npm run db:seed         # Import items & contacts
npm run db:studio       # Open database GUI
npm run dev             # Start the app
```

---

**Need help?** Check `DATABASE_SETUP.md` for more details.
