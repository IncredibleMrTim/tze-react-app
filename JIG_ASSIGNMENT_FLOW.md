# Jig Assignment Recording Flow

## Where Jig Assignments Are Recorded

When you assign a job to a jig, it's recorded in the **`JigAssignment` table** in PostgreSQL.

## Complete Flow

### 1. User Assigns Job to Jig
```
User clicks "Assign to JIG-03" for a job
  ↓
handleAssignJobToJig(jigName: "JIG-03", jobId: "123", pct: 100)
  ↓
Creates IJigAssignment object:
{
  id: "1720345678901",
  jobId: "123",
  jigName: "JIG-03",
  pct: 100,
  pic: null,
  completedAt: null,
  loadedAt: 1720345678901
}
  ↓
Saves to local store (immediate UI update)
  ↓
POST /api/jigs → Saves to PostgreSQL
  ↓
Record created in JigAssignment table ✅
```

## Database Schema

### JigAssignment Table

```sql
CREATE TABLE "JigAssignment" (
  id          TEXT PRIMARY KEY,
  jobId       TEXT NOT NULL,           -- Links to Job table
  jigName     TEXT NOT NULL,           -- e.g., "JIG-01", "JIG-02"
  pct         FLOAT NOT NULL,          -- Percentage of jig used (0-100)
  pic         TEXT,                    -- Optional photo of jig
  completedAt BIGINT,                  -- When jig was marked complete (timestamp)
  loadedAt    BIGINT NOT NULL,         -- When job was loaded to jig (timestamp)
  createdAt   TIMESTAMP DEFAULT NOW(), -- Database record creation
  updatedAt   TIMESTAMP,               -- Last update time
  
  -- Foreign key
  FOREIGN KEY (jobId) REFERENCES Job(id) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX idx_jobId ON JigAssignment(jobId);
CREATE INDEX idx_jigName ON JigAssignment(jigName);
```

## What Gets Recorded

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique assignment ID | `"1720345678901"` |
| `jobId` | Which job is on the jig | `"TZE-0001"` |
| `jigName` | Which jig (1-6) | `"JIG-03"` |
| `pct` | Jig capacity used (%) | `100` or `50` |
| `pic` | Photo of loaded jig | Base64 string (optional) |
| `loadedAt` | When loaded | `1720345678901` |
| `completedAt` | When completed | `1720356789012` or `null` |

## View Assignments in Database

### Option 1: Prisma Studio
```bash
npm run db:studio
```
- Open http://localhost:5555
- Click **JigAssignment** table
- See all active and completed assignments

### Option 2: API Query
```bash
# Get all jig assignments
curl http://localhost:3000/api/jigs

# Get assignments for specific job
# (Filter in your app code)
```

## Querying Jig Assignments

### Find what's on a specific jig
```typescript
const assignments = await prisma.jigAssignment.findMany({
  where: {
    jigName: 'JIG-03',
    completedAt: null  // Only active assignments
  },
  include: {
    job: true  // Include full job details
  }
})
```

### Find all jigs for a job
```typescript
const jobJigs = await prisma.jigAssignment.findMany({
  where: {
    jobId: 'TZE-0001'
  }
})
```

### Find available jig capacity
```typescript
const jigUsage = await prisma.jigAssignment.findMany({
  where: {
    jigName: 'JIG-03',
    completedAt: null
  }
})

const totalUsed = jigUsage.reduce((sum, a) => sum + a.pct, 0)
const available = 100 - totalUsed  // Percentage available
```

## Related Database Tables

### Job Table
Links to JigAssignment via `jobId`
- Contains job details, PO number, customer info
- Has `poComplete` flag set when all jigs done

### Relationship
```
Job (1) ←→ (Many) JigAssignment
```

One job can be on multiple jigs (split across jigs), or same jig multiple times.

## Lifecycle Example

### Job TZE-0001 assigned to JIG-03:

**1. Initial Assignment**
```json
{
  "id": "1720345678901",
  "jobId": "TZE-0001",
  "jigName": "JIG-03",
  "pct": 100,
  "loadedAt": 1720345678901,
  "completedAt": null,  // Not complete yet
  "pic": null
}
```

**2. Jig Marked Complete**
```json
{
  "id": "1720345678901",
  "jobId": "TZE-0001",
  "jigName": "JIG-03",
  "pct": 100,
  "loadedAt": 1720345678901,
  "completedAt": 1720356789012,  // NOW COMPLETE ✅
  "pic": null
}
```

**3. Job Status Updated**
When all jigs for this job are complete:
- Job table: `poComplete` = `true`
- Job ready for dispatch

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jigs` | GET | List all jig assignments |
| `/api/jigs` | POST | Create new assignment |
| `/api/jigs/:id` | PATCH | Update assignment (e.g., mark complete) |
| `/api/jigs/:id` | DELETE | Remove assignment |

## Summary

✅ **Location:** `JigAssignment` table in PostgreSQL  
✅ **When:** Immediately when job assigned to jig  
✅ **What:** Job ID, jig name, capacity %, timestamps  
✅ **Tracks:** Load time, completion time, jig photos  
✅ **Links:** Foreign key to Job table  
✅ **Persists:** Across app restarts, available in Prisma Studio  

Your complete jig workflow is tracked in the database!
