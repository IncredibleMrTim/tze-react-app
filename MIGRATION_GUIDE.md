# Server Components Migration Guide

## ✅ What We've Done

Created the foundation for migrating from Zustand to Server Components + Server Actions:

### 1. Server Actions (`app/actions/`)
- ✅ `jobs.ts` - CRUD operations for jobs
- ✅ `jigs.ts` - CRUD operations for jig assignments

### 2. New Pattern Files
- ✅ `IntakeClient.tsx` - Client component with interactivity
- ✅ `page-server.tsx` - Server component for data fetching
- ✅ `hooks/useToast.ts` - Toast notifications

## 🎯 The Pattern

### Server Component (Data Loading)
```typescript
// page.tsx
import { getJobs } from '@/lib/db'
import ClientComponent from './ClientComponent'

export default async function Page() {
  const data = await getJobs()
  return <ClientComponent initialData={data} />
}
```

### Client Component (Interactivity)
```typescript
// ClientComponent.tsx
'use client'
import { useTransition } from 'react'
import { createJobAction } from '@/actions/jobs'

export default function ClientComponent({ initialData }) {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState(initialData)

  const handleCreate = () => {
    startTransition(async () => {
      // Optimistic update
      setData([...data, newItem])
      
      // Server action
      const result = await createJobAction(newItem)
      
      if (!result.success) {
        // Revert on error
        setData(initialData)
      }
    })
  }

  return <div>...</div>
}
```

### Server Actions (Mutations)
```typescript
// actions/jobs.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function createJobAction(job) {
  await createJob(job)
  revalidatePath('/jobs') // Refresh cache
  return { success: true }
}
```

## 📋 Migration Checklist

### Phase 1: Core Actions (✅ DONE)
- [x] Create `actions/jobs.ts`
- [x] Create `actions/jigs.ts`
- [x] Create `hooks/useToast.ts`

### Phase 2: Intake Page (⏳ IN PROGRESS)
- [x] Create `IntakeClient.tsx`
- [x] Create `page-server.tsx`
- [ ] Test the new intake page
- [ ] Replace old `page.tsx` with `page-server.tsx`
- [ ] Remove intake-related Zustand code

### Phase 3: Other Pages
- [ ] Migrate `/jobs` page
- [ ] Migrate `/jig` page
- [ ] Migrate `/dispatch` page

### Phase 4: Cleanup
- [ ] Remove `store/useStore.ts`
- [ ] Remove `components/DbInit.tsx`
- [ ] Remove `hooks/useDbSync.ts`
- [ ] Remove API routes (or keep for external access)
- [ ] Update any remaining components

## 🔄 To Test the New Intake Page

1. **Rename files:**
   ```bash
   mv app/(pages)/intake/page.tsx app/(pages)/intake/page-old.tsx
   mv app/(pages)/intake/page-server.tsx app/(pages)/intake/page.tsx
   ```

2. **Install dependencies (if needed):**
   ```bash
   npm install sonner  # For toast notifications
   ```

3. **Add Toast Provider to layout:**
   ```typescript
   // app/layout.tsx
   import { Toaster } from 'sonner'
   
   export default function Layout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Toaster />
         </body>
       </html>
     )
   }
   ```

4. **Test:**
   - Create a job
   - Edit a job
   - Delete a job
   - Verify instant UI updates (optimistic)
   - Verify data persists after page refresh

## 💡 Benefits Over Zustand

### Before (Zustand):
- 🔴 Duplicate state (memory + DB)
- 🔴 Manual sync logic
- 🔴 Client-side only
- 🔴 No SEO/SSR benefits

### After (Server Components):
- ✅ Single source of truth (DB)
- ✅ Automatic revalidation
- ✅ Server-side rendering
- ✅ Better performance
- ✅ Simpler codebase
- ✅ Still has optimistic updates

## 🚀 Next Steps

1. **Test the intake page migration**
2. **Apply the same pattern to `/jobs`, `/jig`, `/dispatch`**
3. **Remove Zustand entirely**
4. **Enjoy a simpler, more maintainable codebase!**

## 📚 Resources

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [useOptimistic Hook](https://react.dev/reference/react/useOptimistic)
- [useTransition Hook](https://react.dev/reference/react/useTransition)
