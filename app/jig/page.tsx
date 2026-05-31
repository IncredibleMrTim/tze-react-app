'use client'

import { useApp } from '@/context/AppContext'
import { JIGView } from '@/components/JIGView'

export default function JIGPage() {
  const {
    jigsList,
    jobs,
    jigA,
    settings,
    handleAssignJobToJig,
    handleCompleteJig,
    showToast,
  } = useApp()

  return (
    <JIGView
      jigsList={jigsList}
      jobs={jobs}
      jigA={jigA}
      settings={settings}
      onAssignJob={handleAssignJobToJig}
      onCompleteJig={handleCompleteJig}
      onShowToast={showToast}
    />
  )
}
