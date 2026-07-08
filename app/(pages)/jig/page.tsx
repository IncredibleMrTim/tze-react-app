import { getJobs, getJigAssignments, getSettings } from '@/lib/db'
import { generateJigsList } from '@/constants/settings.const'
import JigClient from './JigClient'

export const dynamic = 'force-dynamic'

export default async function JigPage() {
  const [jobs, jigAssignments, settings] = await Promise.all([
    getJobs(),
    getJigAssignments(),
    getSettings(),
  ])

  const jigsList = generateJigsList(settings.jigCount)

  return (
    <JigClient
      initialJobs={jobs}
      initialJigAssignments={jigAssignments}
      jigsList={jigsList}
    />
  )
}
