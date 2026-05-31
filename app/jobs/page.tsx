'use client'

import { useApp } from '@/context/AppContext'
import { JobsView } from '@/components/JobsView'

export default function JobsPage() {
  const { jobs, jigA, handleJobClick } = useApp()

  return (
    <JobsView
      jobs={jobs}
      jigA={jigA}
      onJobClick={handleJobClick}
    />
  )
}
