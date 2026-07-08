import { getJobs, getJigAssignments, getSettings } from '@/lib/db'
import DispatchClient from './DispatchClient'

export const dynamic = 'force-dynamic'

export default async function DispatchPage() {
  const [jobs, jigAssignments, settings] = await Promise.all([
    getJobs(),
    getJigAssignments(),
    getSettings(),
  ])

  return (
    <DispatchClient
      initialJobs={jobs}
      initialJigAssignments={jigAssignments}
      initialSettings={settings}
      initialInvSeq={settings.invSeq}
    />
  )
}
