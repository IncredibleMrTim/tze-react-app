import { getItems, getContacts, getJigAssignments } from '@/lib/db'
import IntakeClient from './IntakeClient'

// Still fetch static/rarely-changing data on server for initial load
export default async function IntakePage() {
  // Fetch items, contacts, and jig assignments on server (relatively static)
  // Jobs will be fetched client-side with React Query for real-time updates
  const [items, contacts, jigAssignments] = await Promise.all([
    getItems(),
    getContacts(),
    getJigAssignments(),
  ])

  return (
    <IntakeClient
      items={items}
      contacts={contacts}
      initialJigAssignments={jigAssignments}
    />
  )
}
