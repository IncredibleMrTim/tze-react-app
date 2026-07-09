import JobsClient from './JobsClient'

export const dynamic = 'force-dynamic'

// All data fetched client-side with React Query for fast navigation and real-time updates
export default function JobsPage() {
  return <JobsClient />
}
