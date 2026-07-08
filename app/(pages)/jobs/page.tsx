import { getJobs, getJigAssignments } from '@/lib/db'
import JobsClient from './JobsClient'

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
  const [jobs, jigAssignments] = await Promise.all([
    getJobs(),
    getJigAssignments(),
  ])

  return (
    <JobsClient
      initialJobs={jobs}
      initialJigAssignments={jigAssignments}
    />
  )
}
