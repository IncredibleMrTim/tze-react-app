# Test: Job Tracking in Database

## Test Steps

### 1. Create a Test Job
1. Start the app: `npm run dev`
2. Go to Intake page
3. Create a new job:
   - PO Number: TEST-001
   - Customer: Any customer
   - Add at least one part
4. Click Save

**Expected Result:**
- Job appears in the intake list
- Console shows: Database save success (check browser console)

### 2. Verify Database Persistence
Open Prisma Studio to view the database:
```bash
npm run db:studio
```

Go to: http://localhost:5555

**Check:**
- Click on `Job` table
- Find your TEST-001 job
- Verify all fields are saved correctly

### 3. Test Persistence Across Sessions
1. Close the browser completely
2. Reopen and go to http://localhost:3000
3. Navigate to Intake page

**Expected Result:**
- TEST-001 job is still there ✅

### 4. Test Job Editing
1. Click on TEST-001 job
2. Edit something (e.g., change notes)
3. Save

**Check in Prisma Studio:**
- Refresh the Job table
- Verify the changes are saved

### 5. Test Jig Assignment
1. Assign TEST-001 to a jig
2. Check JigAssignment table in Prisma Studio
3. Verify the assignment is recorded with:
   - jobId (matches TEST-001)
   - jigName
   - loadedAt timestamp

### 6. Test Complete Flow
1. Mark the jig as complete
2. Check in Prisma Studio:
   - Job: `poComplete` should be `true`
   - JigAssignment: `completedAt` should have a timestamp

### 7. Test Dispatch
1. Dispatch the job
2. Check in Prisma Studio:
   - Job: `dispatchedAt` should have a timestamp
   - Job: `invoiceNumber` should be set

## What's Being Tracked

Every job stores:
- ✅ All job details (PO number, customer, parts, etc.)
- ✅ Creation timestamp
- ✅ Edit history (via updatedAt)
- ✅ Jig assignments with load times
- ✅ Completion status and time
- ✅ Dispatch timestamp and invoice number
- ✅ All flags (urgent, internal, flagged, etc.)

## Database Tables

### Job Table
Stores all job/PO information:
- Basic info: po_number, customer details, parts
- Status: poComplete, dispatchedAt, invoiceNumber
- Flags: urgent, isInternal, flagged, etc.
- Timestamps: createdAt, updatedAt, dispatchedAt

### JigAssignment Table
Tracks job progress through jigs:
- jobId → links to Job
- jigName → which jig
- loadedAt → when assigned
- completedAt → when finished
- pct → percentage of jig used

### Settings Table
Stores invoice sequence and app config:
- invSeq → current invoice number
- All plating rates and settings

## Troubleshooting

**If jobs don't persist:**
1. Check browser console for API errors
2. Verify DATABASE_URL in .env is correct
3. Check Prisma Studio - is the database reachable?
4. Check server logs in `.next/dev/logs/next-development.log`

**If can't see jobs in Prisma Studio:**
```bash
npm run db:studio
```
Should open http://localhost:5555
Check that the database connection is working.

## Current Status

✅ Job creation → Database
✅ Job editing → Database  
✅ Jig assignment → Database
✅ Jig completion → Database
✅ Job dispatch → Database
✅ All changes persist across app restarts

Your complete job lifecycle is tracked in PostgreSQL!
