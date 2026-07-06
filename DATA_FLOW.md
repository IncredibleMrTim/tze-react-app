# Data Flow - Database Integration

## Current Data Source: **PostgreSQL Database** ✅

Your app now loads ALL data from the PostgreSQL database, not from JSON files.

## How It Works

### 1. App Startup (Automatic)
```
User opens app
  ↓
DbInit component runs (app/components/DbInit.tsx)
  ↓
Fetches data from API routes:
  - GET /api/items → Loads all 2,765 items
  - GET /api/contacts → Loads all 179 contacts
  - GET /api/jobs → Loads all jobs
  - GET /api/jigs → Loads all jig assignments
  - GET /api/settings → Loads app settings
  ↓
Stores data in Zustand store
  ↓
Components use data from store
```

### 2. Creating/Updating Data
```
User creates/updates job
  ↓
Zustand store action (handleSaveJob, handleUpdateJob, etc.)
  ↓
Updates local store immediately (optimistic update)
  ↓
Sends to database via API:
  - POST /api/jobs
  - PATCH /api/jobs/:id
  - DELETE /api/jobs/:id
  ↓
Database persists the change
```

### 3. Data Persistence
- ✅ Jobs persist in database
- ✅ Jig assignments persist in database
- ✅ Settings persist in database
- ✅ Items and contacts loaded from database
- ✅ Close app → reopen → data still there

## Files Updated

### Store
- `app/store/useStore.ts` - Added `items` and `contacts` state

### Database Initialization
- `app/components/DbInit.tsx` - Loads all data on startup

### Components
- `app/(pages)/intake/page.tsx` - Uses items/contacts from store

### Helpers
- `app/lib/helpers.ts` - Updated `resolveCustomer()` to accept contacts parameter

## API Routes (Database Access)

All API routes are in `app/api/`:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/items` | GET | Fetch all items |
| `/api/contacts` | GET | Fetch all contacts |
| `/api/jobs` | GET, POST | List/create jobs |
| `/api/jobs/:id` | GET, PATCH, DELETE | Get/update/delete job |
| `/api/jigs` | GET, POST | List/create jig assignments |
| `/api/jigs/:id` | PATCH, DELETE | Update/delete jig assignment |
| `/api/settings` | GET, PATCH | Get/update settings |

## JSON Files (Legacy)

The JSON files in `app/data/` are now **only used for seeding**:
- `app/data/items.json` - Source for initial items import
- `app/data/contacts.json` - Source for initial contacts import

**They are NOT used by the running app.**

## Verifying Data Source

To verify the app is using the database:

1. **Check browser console** when you open the app:
   ```
   ✓ Loaded 2765 items from database
   ✓ Loaded 179 contacts from database
   ✓ Loaded X jobs from database
   ✓ Loaded X jig assignments from database
   ✓ Loaded settings from database
   ✅ All data loaded from database
   ```

2. **Create a test job**:
   - Create a new job in the app
   - Close the browser completely
   - Reopen the app
   - Job should still be there ✅

3. **View data directly**:
   ```bash
   npm run db:studio
   ```
   Opens Prisma Studio at http://localhost:5555 to browse your database

## Network Tab (Developer Tools)

When the app loads, you'll see these API calls in the Network tab:
- `GET /api/items` - Loading items
- `GET /api/contacts` - Loading contacts
- `GET /api/jobs` - Loading jobs
- `GET /api/jigs` - Loading jigs
- `GET /api/settings` - Loading settings

When you create/update data:
- `POST /api/jobs` - Creating new job
- `PATCH /api/jobs/:id` - Updating job
- `DELETE /api/jobs/:id` - Deleting job

## Summary

✅ **Items**: Database (2,765 items)
✅ **Contacts**: Database (179 contacts)  
✅ **Jobs**: Database (persisted)
✅ **Jigs**: Database (persisted)
✅ **Settings**: Database (persisted)

❌ **JSON Files**: Only used for initial seed, not runtime
