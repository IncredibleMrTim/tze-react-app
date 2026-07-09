import { getJobs, getJigAssignments, getItems, getContacts } from '@/lib/db'
import IntakeClient from './IntakeClient'

export const dynamic = 'force-dynamic' // Always fetch fresh data

export default async function IntakePage() {
  // Fetch all data in parallel on the server
  const [jobs, jigAssignments, items, contacts] = await Promise.all([
    getJobs(),
    getJigAssignments(),
    getItems(),
    getContacts(),
  ])

  return (
    <IntakeClient
      initialJobs={jobs}
      initialJigAssignments={jigAssignments}
      items={items}
      contacts={contacts}
    />
  )
}
