'use client'

import { useApp } from '@/context/AppContext'
import { DispatchView } from '@/components/DispatchView'

export default function DispatchPage() {
  const {
    jobs,
    jigA,
    settings,
    invSeq,
    handleDispatch,
    showToast,
  } = useApp()

  return (
    <DispatchView
      jobs={jobs}
      jigA={jigA}
      settings={settings}
      invSeq={invSeq}
      onDispatch={handleDispatch}
      onShowToast={showToast}
    />
  )
}
