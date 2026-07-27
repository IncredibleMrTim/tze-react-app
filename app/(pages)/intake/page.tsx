import { Suspense } from 'react'
import IntakeClient from './IntakeClient'

// All data fetched client-side with React Query for fast navigation and real-time updates
export default function IntakePage() {
  return (
    <Suspense>
      <IntakeClient />
    </Suspense>
  )
}
