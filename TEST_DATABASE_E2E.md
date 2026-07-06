# Test Database End-to-End (No Zustand Persist)

## Current Setup

✅ **Zustand localStorage persistence is DISABLED**  
✅ All data must come from PostgreSQL database  
✅ No local caching - pure database mode

## Test Steps

### 1. Clear Browser Storage

Open browser console and run:
```javascript
localStorage.clear()
sessionStorage.clear()
console.log('✓ Storage cleared')
```

Or in Chrome DevTools:
- F12 → Application → Storage → Clear site data

### 2. Restart the App

```bash
# Stop the dev server (Ctrl+C)
# Start fresh
npm run dev
```

### 3. Open the App

Go to: http://localhost:3000

**Check Console Output:**
```
✓ Loaded 2765 items from database
✓ Loaded 179 contacts from database
✓ Loaded X jobs from database
✓ Loaded X jig assignments from database
✓ Loaded settings from database
✅ All data loaded from database
```

### 4. Test Job Creation

**A. Create a New Job:**
1. Go to Intake page
2. Fill in job details:
   - PO Number: TEST-DB-001
   - Customer: Any customer
   - Add at least one part
3. Click Save

**Expected:**
- Job appears in the list immediately (from local state)
- Console shows: `✓ Job saved to database`

**B. Verify in Database:**
```bash
npm run db:studio
```
- Open http://localhost:5555
- Click **Job** table
- Find TEST-DB-001
- ✅ Should be there!

**C. Refresh Browser:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
- Job should STILL be there
- If it's there, database persistence works! ✅

### 5. Test Job Editing

1. Click on TEST-DB-001
2. Edit something (e.g., change notes to "Database test")
3. Save

**Verify:**
- Refresh Prisma Studio
- Check Job table → TEST-DB-001
- Notes field should show "Database test"

### 6. Test Jig Assignment

**A. Assign to Jig:**
1. Assign TEST-DB-001 to JIG-01
2. Console should show: `✓ Jig assignment saved to database`

**B. Verify in Database:**
- Prisma Studio → **JigAssignment** table
- Find assignment with jobId = TEST-DB-001
- Check: jigName = "JIG-01", completedAt = null

**C. Refresh Browser:**
- Job should still show as assigned to JIG-01
- ✅ Assignment persisted!

### 7. Test Jig Completion

1. Mark JIG-01 as complete
2. Check Prisma Studio:
   - JigAssignment: completedAt has timestamp
   - Job: poComplete = true

### 8. Test Dispatch

1. Dispatch TEST-DB-001
2. Enter invoice number
3. Check Prisma Studio:
   - Job: dispatchedAt has timestamp
   - Job: invoiceNumber is set
   - Settings: invSeq incremented

### 9. Test Session Persistence

**Complete Flow Test:**
1. Create job → Assign to jig → Complete jig → Dispatch
2. Close browser completely
3. Reopen browser to http://localhost:3000
4. Check if:
   - Job exists ✅
   - Jig assignment exists ✅
   - Job status is correct ✅

If all these persist, **database E2E is working!** 🎉

## What This Tests

### Data Flow (No localStorage)
```
User Action
  ↓
Update Zustand Store (in-memory only)
  ↓
Send to Database via API
  ↓
Data saved in PostgreSQL
  ↓
On page reload: Fetch from database
  ↓
Populate Zustand Store
```

### Verified Operations

✅ **CREATE** - Jobs and jig assignments save to database  
✅ **READ** - Data loads from database on app start  
✅ **UPDATE** - Job edits, jig completion, dispatch save  
✅ **DELETE** - Job deletion removes from database  
✅ **PERSIST** - Data survives browser restart  
✅ **SYNC** - Multiple tabs/windows see same data (after refresh)

## Expected Behavior

### Without localStorage:
- ❌ Data does NOT persist in browser storage
- ✅ Data DOES persist in PostgreSQL database
- ✅ App always loads fresh from database
- ✅ Multiple devices can access same data

### What Should Fail:
- Closing browser → data lost? **NO** ✅ (in database)
- Clearing cache → data lost? **NO** ✅ (in database)
- Different browser → no data? **NO** ✅ (loads from database)

## Troubleshooting

### Jobs disappear after refresh
**Problem:** Database save failed  
**Check:**
1. Browser console - any API errors?
2. Server logs: `tail -50 .next/dev/logs/next-development.log`
3. Prisma Studio - is job in database?

### Can't create jobs
**Problem:** API route error  
**Check:**
1. Is DATABASE_URL correct in `.env`?
2. Run: `curl http://localhost:3000/api/jobs`
3. Should return array (maybe empty, but not error)

### Jig assignments not saving
**Problem:** BigInt serialization or foreign key  
**Check:**
1. Does the job exist in database?
2. Is jobId correct (string, not number)?
3. Check server logs for specific error

## Re-enable localStorage

When testing is complete, to re-enable localStorage:

**Edit `app/store/useStore.ts`:**
```typescript
// Line 53 - Change this:
const DISABLE_PERSIST = true;

// To:
const DISABLE_PERSIST = false;
```

Then restart dev server.

## Summary

This test mode proves:
- ✅ Database is the source of truth
- ✅ localStorage is just a cache (not required)
- ✅ App works purely from PostgreSQL
- ✅ Data persists across sessions
- ✅ Multiple devices can share data

**Current Status:** localStorage persistence **DISABLED** - pure database mode active!
