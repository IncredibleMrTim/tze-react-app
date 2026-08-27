import { getSettings, getStaff, getPendingInvitations } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/session'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [settings, session] = await Promise.all([getSettings(), getSession()])
  const isCurrentUserAdmin = isAdmin(session?.user.role)

  if (!isCurrentUserAdmin) {
    return <SettingsClient initialSettings={settings} isAdmin={false} />
  }

  const [staff, pendingInvitations] = await Promise.all([
    getStaff(),
    getPendingInvitations(),
  ])

  return (
    <SettingsClient
      initialSettings={settings}
      isAdmin
      staff={staff}
      pendingInvitations={pendingInvitations}
    />
  )
}
