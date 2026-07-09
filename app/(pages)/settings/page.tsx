import { getSettings } from '@/lib/db'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await getSettings()

  return <SettingsClient initialSettings={settings} />
}
