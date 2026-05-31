'use client'

import { useApp } from '@/context/AppContext'
import { IntakeView } from '@/components/IntakeView'

export default function IntakePage() {
  const {
    jobs,
    jigA,
    settings,
    handleSaveJob,
    handleUpdateJob,
    handleDeleteJob,
    showToast,
  } = useApp()

  return (
    <IntakeView
      settings={settings}
      jobs={jobs}
      jigA={jigA}
      onSave={handleSaveJob}
      onUpdateJob={handleUpdateJob}
      onDeleteJob={handleDeleteJob}
      onShowToast={showToast}
    />
  )
}
