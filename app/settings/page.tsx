'use client'

import { useApp } from '@/context/AppContext'
import { SettingsView } from '@/components/SettingsView'

export default function SettingsPage() {
  const { settings, setSettings, showToast } = useApp()

  return (
    <SettingsView
      settings={settings}
      onUpdateSettings={setSettings}
      onShowToast={showToast}
    />
  )
}
