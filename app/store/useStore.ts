'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { IJob, IJigAssignment, ISettings } from "@/types/interfaces"
import { DEFAULT_SETTINGS, generateJigsList } from "@/constants/settings.const"
import { loadApiKey } from "@/lib/storage"
import { getNextTZE } from "@/lib/helpers"

interface AppState {
  // State
  jobs: IJob[]
  jigA: IJigAssignment[]
  jigPhotos: Record<string, string>
  invSeq: number
  settings: ISettings
  jigsList: string[]
  toast: string | null
  lightbox: string | null

  // Actions
  setJobs: (jobs: IJob[]) => void
  setJigA: (jigA: IJigAssignment[]) => void
  setJigPhotos: (jigPhotos: Record<string, string>) => void
  setInvSeq: (invSeq: number) => void
  setSettings: (settings: ISettings) => void
  setToast: (toast: string | null) => void
  setLightbox: (lightbox: string | null) => void

  // Job actions
  handleSaveJob: (job: IJob) => void
  handleUpdateJob: (updatedJob: IJob) => void
  handleDeleteJob: (jobId: string) => void

  // JIG actions
  handleAssignJobToJig: (jigName: string, jobId: string, pct: number) => void
  handleCompleteJig: (jigName: string) => void

  // Dispatch actions
  handleDispatch: (job: IJob, invoiceNumber: string) => void

  // UI actions
  handleJobClick: (job: IJob) => void
  showToast: (message: string) => void
  showLightbox: (src: string) => void
  closeLightbox: () => void
}

export const useStore = create<AppState>()(
  devtools(
    persist(
    (set, get) => ({
      // Initial state
      jobs: [],
      jigA: [],
      jigPhotos: {},
      invSeq: 1,
      settings: { ...DEFAULT_SETTINGS, apiKey: loadApiKey() },
      jigsList: generateJigsList(DEFAULT_SETTINGS.jigCount),
      toast: null,
      lightbox: null,

      // Basic setters
      setJobs: (jobs) => set({ jobs }),
      setJigA: (jigA) => set({ jigA }),
      setJigPhotos: (jigPhotos) => set({ jigPhotos }),
      setInvSeq: (invSeq) => set({ invSeq }),
      setSettings: (settings) => set({
        settings,
        jigsList: generateJigsList(settings.jigCount)
      }),
      setToast: (toast) => set({ toast }),
      setLightbox: (lightbox) => set({ lightbox }),

      // Job actions
      handleSaveJob: (job) => {
        const { jobs } = get()
        set({ jobs: [...jobs, job] })
      },

      handleUpdateJob: (updatedJob) => {
        const { jobs } = get()
        set({ jobs: jobs.map(j => (j.id === updatedJob.id ? updatedJob : j)) })
      },

      handleDeleteJob: (jobId) => {
        const { jobs, jigA } = get()
        set({
          jobs: jobs.filter(j => j.id !== jobId),
          jigA: jigA.filter(g => g.jobId !== jobId)
        })
      },

      // JIG actions
      handleAssignJobToJig: (jigName, jobId, pct) => {
        const { jigA } = get()
        const assignment: IJigAssignment = {
          id: Date.now().toString(),
          jobId,
          jigName,
          pct,
          pic: null,
          completedAt: null,
          loadedAt: Date.now(),
        }
        set({ jigA: [...jigA, assignment] })
      },

      handleCompleteJig: (jigName) => {
        const { jigA, jobs } = get()
        const now = Date.now()

        const updatedJigA = jigA.map(g =>
          g.jigName === jigName && !g.completedAt
            ? { ...g, completedAt: now }
            : g
        )

        // Mark all jobs on this JIG as PO complete
        const jigJobIds = jigA.filter(g => g.jigName === jigName).map(g => g.jobId)
        const updatedJobs = jobs.map(j =>
          jigJobIds.includes(j.id) ? { ...j, poComplete: true } : j
        )

        set({ jigA: updatedJigA, jobs: updatedJobs })
      },

      // Dispatch actions
      handleDispatch: (job, invoiceNumber) => {
        const { invSeq } = get()
        get().handleUpdateJob(job)
        if (invoiceNumber !== 'INTERNAL') {
          set({ invSeq: invSeq + 1 })
        }
      },

      // UI actions
      handleJobClick: (job) => {
        get().showToast(`Viewing: ${job.po_number}`)
      },

      showToast: (message) => {
        set({ toast: message })
      },

      showLightbox: (src) => {
        set({ lightbox: src })
      },

      closeLightbox: () => {
        set({ lightbox: null })
      },
    }),
    {
      name: 'tze-storage',
      partialize: (state) => ({
        jobs: state.jobs,
        jigA: state.jigA,
        jigPhotos: state.jigPhotos,
        invSeq: state.invSeq,
        nextTZE: getNextTZE(),
      }),
    }
    ),
    { name: 'TZE Store' }
  )
)
