# Database Setup Guide

This guide will help you set up PostgreSQL with Prisma for the TZE React App.

## Prerequisites

You need a PostgreSQL database. You have several options:

### Option 1: Local PostgreSQL (Recommended for development)
Install PostgreSQL locally:
- **macOS**: `brew install postgresql@16` then `brew services start postgresql@16`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Linux**: `sudo apt-get install postgresql`

### Option 2: Docker
```bash
docker run --name tze-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=tze_db \
  -p 5432:5432 \
  -d postgres:16
```

### Option 3: Cloud Hosting (Recommended for production)
- [Supabase](https://supabase.com) (Free tier available)
- [Neon](https://neon.tech) (Free tier available)
- [Railway](https://railway.app)
- [Render](https://render.com)

## Setup Steps

### 1. Configure Database Connection

Edit the `.env` file in the project root and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tze_db?schema=public"
```

Replace:
- `username`: Your PostgreSQL username (default: `postgres`)
- `password`: Your PostgreSQL password
- `localhost:5432`: Your database host and port
- `tze_db`: Your database name

**Examples:**

Local PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/tze_db?schema=public"
```

Supabase:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 2. Generate Prisma Client

This generates the TypeScript types and client based on your schema:

```bash
npm run db:generate
```

### 3. Push Schema to Database

This creates all the tables in your database:

```bash
npm run db:push
```

Or if you want to create migrations (recommended for production):

```bash
npm run db:migrate
```

### 4. Seed the Database

This will import all your existing items and contacts from the JSON files:

```bash
npm run db:seed
```

This will:
- Import all items from `app/data/items.json`
- Import all contacts from `app/data/contacts.json`
- Create default settings

### 5. Verify Setup

You can open Prisma Studio to view and edit your database:

```bash
npm run db:studio
```

This opens a GUI at [http://localhost:5555](http://localhost:5555) where you can browse your data.

## Database Schema

The database includes the following tables:

- **Item**: Product catalog with codes, descriptions, prices, and customers
- **Contact**: Customer contacts with names, accounts, emails, and aliases
- **Job**: Purchase orders with all job details and parts
- **JigAssignment**: Assignments of jobs to jigs
- **Settings**: Application settings (singleton table)
- **JigPhoto**: Jig photos storage

## Data Persistence

With this setup:
- All jobs, items, contacts, and settings are stored in PostgreSQL
- Data persists when you close and reopen the app
- Multiple users can access the same data (if hosted)
- You can backup your database using PostgreSQL tools

## Syncing with the App

The app automatically syncs with the database:
- On app load, data is fetched from the database
- When you create/update jobs, they're saved to the database
- The Zustand store acts as a local cache for fast access

## Useful Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes (no migration files)
npm run db:push

# Create and run migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Troubleshooting

### "Can't reach database server"
- Check that PostgreSQL is running
- Verify your DATABASE_URL is correct
- Check firewall settings if using a remote database

### "Database does not exist"
Create the database first:
```bash
createdb tze_db
```

### "Role does not exist"
Create a PostgreSQL user:
```bash
createuser -s postgres
```

### Resetting the database
If you need to start fresh:
```bash
npm run db:push -- --force-reset
npm run db:seed
```

## Next Steps

After setup:
1. Start the dev server: `npm run dev`
2. The app will automatically load data from the database
3. Create a new job to test that it persists
4. Close and reopen the app to verify persistence

## Migration from Local Storage

Your existing Zustand store currently uses localStorage. After setting up the database:
- Old data in localStorage will be ignored
- The app will load from the database instead
- You may want to manually migrate any important jobs from localStorage to the database
- Or clear localStorage with: `localStorage.clear()` in the browser console
