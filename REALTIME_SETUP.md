# Real-Time Updates with Pusher

Your app now broadcasts changes instantly to all team members using Pusher WebSockets.

## Setup Instructions

### 1. Get Pusher Credentials (Free Tier)

1. Go to https://dashboard.pusher.com/
2. Sign up or log in
3. Click "Create new app"
4. Choose:
   - **Name**: TZE Manufacturing App
   - **Cluster**: Choose closest to New Zealand (ap4 - Singapore)
   - **Frontend**: React
   - **Backend**: Node.js
5. Click "Create app"

### 2. Copy Credentials to `.env.local`

From your Pusher dashboard, go to "App Keys" and copy:

```bash
PUSHER_APP_ID=your_app_id_here
PUSHER_SECRET=your_secret_here
NEXT_PUBLIC_PUSHER_KEY=your_key_here
NEXT_PUBLIC_PUSHER_CLUSTER=ap4  # or your chosen cluster
```

**Important**: Replace the placeholder values in your `.env.local` file.

### 3. Restart Your Dev Server

```bash
yarn dev
```

## How It Works

### Broadcasting Events (Server Actions)

When you update data, broadcast it to all connected clients:

```typescript
// app/actions/jobs.ts
import { broadcastEvent } from "@/lib/pusher-server";

export async function createJobAction(job: IJob) {
  const result = await createJob(job);

  // Notify all users instantly
  await broadcastEvent("jobs", "job:created", result);

  return { success: true, job: result };
}
```

### Listening for Events (Components)

Use the `usePusherEvent` hook to react to changes:

```typescript
"use client";

import { usePusherEvent } from "@/lib/pusher-client";
import { IJob } from "@/types/interfaces";

export function JobsPage({ initialJobs }) {
  const [jobs, setJobs] = useState(initialJobs);

  // Listen for new jobs
  usePusherEvent<IJob>("jobs", "job:created", (newJob) => {
    setJobs((prev) => [newJob, ...prev]);
    toast.success(`New job: ${newJob.poNumber}`);
  });

  // Listen for updates
  usePusherEvent<IJob>("jobs", "job:updated", (updatedJob) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === updatedJob.id ? updatedJob : j))
    );
  });

  // Listen for deletions
  usePusherEvent<{ jobId: string }>("jobs", "job:deleted", ({ jobId }) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  });

  return <div>{/* Your UI */}</div>;
}
```

## Event Patterns

### Channel Names
- `jobs` - Job updates
- `inventory` - Inventory changes
- `jigs` - Jig assignments
- `dispatch` - Dispatch updates

### Event Names
Use pattern: `resource:action`
- `job:created`
- `job:updated`
- `job:deleted`
- `inventory:updated`
- `jig:assigned`

## What's Already Integrated

✅ **Job Actions** - Create, update, delete jobs broadcast to all users

## What to Add Next

Add broadcasting to other Server Actions:

### Jig Actions
```typescript
// app/actions/jigs.ts
import { broadcastEvent } from "@/lib/pusher-server";

export async function assignJobToJig(jobId: string, jigId: string) {
  const result = await assignJob(jobId, jigId);
  await broadcastEvent("jigs", "jig:assigned", result);
  return result;
}
```

### Inventory Actions
```typescript
// When scanning PO updates inventory
await broadcastEvent("inventory", "inventory:updated", updatedItems);
```

### Dispatch Actions
```typescript
// When dispatching jobs
await broadcastEvent("dispatch", "job:dispatched", dispatchedJob);
```

## Free Tier Limits

Pusher free tier includes:
- **100 concurrent connections** (plenty for your team)
- **200k messages/day** (way more than you'll need)
- Unlimited channels

## Testing

1. Open app in two browser windows
2. Create a job in window 1
3. Watch it appear instantly in window 2
4. No refresh needed! 🎉

## Troubleshooting

### Events not broadcasting?
- Check `.env.local` has correct Pusher credentials
- Restart dev server after adding credentials
- Check browser console for Pusher errors

### Events not received?
- Verify `NEXT_PUBLIC_` prefix on client env vars
- Check Network tab for WebSocket connection
- Verify channel/event names match exactly

### Connection issues?
- Check Pusher dashboard "Debug Console" for live events
- Verify cluster matches your account region
- Check firewall isn't blocking WebSocket connections
