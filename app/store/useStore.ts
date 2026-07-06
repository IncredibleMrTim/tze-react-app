'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { IJob, IJigAssignment, ISettings, IItem, IContact } from "@/types/interfaces"
import { DEFAULT_SETTINGS, generateJigsList } from "@/constants/settings.const"
import { loadApiKey } from "@/lib/storage"

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
  items: IItem[]
  contacts: IContact[]

  // Actions
  setJobs: (jobs: IJob[]) => void
  setJigA: (jigA: IJigAssignment[]) => void
  setJigPhotos: (jigPhotos: Record<string, string>) => void
  setInvSeq: (invSeq: number) => void
  setSettings: (settings: ISettings) => void
  setToast: (toast: string | null) => void
  setLightbox: (lightbox: string | null) => void
  setItems: (items: IItem[]) => void
  setContacts: (contacts: IContact[]) => void

  // Job actions
  handleSaveJob: (job: IJob) => Promise<void>
  handleUpdateJob: (updatedJob: IJob) => Promise<void>
  handleDeleteJob: (jobId: string) => Promise<void>

  // JIG actions
  handleAssignJobToJig: (jigName: string, jobId: string, pct: number) => Promise<void>
  handleUpdateJigAssignment: (assignmentId: string, updates: Partial<IJigAssignment>) => Promise<void>
  handleCompleteJig: (jigName: string) => Promise<void>
  handleSendBackJob: (jobId: string) => Promise<void>

  // Dispatch actions
  handleDispatch: (job: IJob, invoiceNumber: string) => Promise<void>
  handleRemoveFromDispatch: (jobId: string) => Promise<void>

  // UI actions
  handleJobClick: (job: IJob) => void
  showToast: (message: string) => void
  showLightbox: (src: string) => void
  closeLightbox: () => void
}

// Temporary: Disable persist to test database E2E
// Comment out 'persist(' and its closing ')' to disable localStorage

export const useStore = create<AppState>()(
  devtools(
    // persist(  // <- DISABLED for testing
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
      items: [],
      contacts: [],

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
      setItems: (items) => set({ items }),
      setContacts: (contacts) => set({ contacts }),

      // Job actions
      handleSaveJob: async (job) => {
        const { jobs } = get()
        // Update local state immediately
        set({ jobs: [...jobs, job] })

        // Sync to database
        try {
          await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(job),
          })
        } catch (error) {
          console.error('Failed to save job to database:', error)
        }
      },

      handleUpdateJob: async (updatedJob) => {
        const { jobs } = get()
        // Update local state immediately
        set({ jobs: jobs.map(j => (j.id === updatedJob.id ? updatedJob : j)) })

        // Sync to database
        try {
          await fetch(`/api/jobs/${updatedJob.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedJob),
          })
        } catch (error) {
          console.error('Failed to update job in database:', error)
        }
      },

      handleDeleteJob: async (jobId) => {
        const { jobs, jigA } = get()
        // Update local state immediately
        set({
          jobs: jobs.filter(j => j.id !== jobId),
          jigA: jigA.filter(g => g.jobId !== jobId)
        })

        // Sync to database
        try {
          await fetch(`/api/jobs/${jobId}`, {
            method: 'DELETE',
          })
        } catch (error) {
          console.error('Failed to delete job from database:', error)
        }
      },

      // JIG actions
      handleAssignJobToJig: async (jigName, jobId, pct) => {
        console.log('🔧 handleAssignJobToJig called:', { jigName, jobId, pct })

        const { jigA } = get()
        const now = Date.now()
        const assignment: IJigAssignment = {
          id: now.toString(),
          jobId,
          jigName,
          pct,
          pic: null,
          completedAt: null,
          loadedAt: now,
          status: 'ACTIVE',
        }

        console.log('📝 Creating assignment:', assignment)

        // Update local state immediately
        set({ jigA: [...jigA, assignment] })
        console.log('✓ Local state updated')

        // Sync to database
        console.log('📤 Sending to database...')
        try {
          console.log('📤 About to fetch...')
          const response = await fetch('/api/jigs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignment),
          })

          console.log('📥 Response status:', response.status)

          if (!response.ok) {
            const error = await response.json()
            console.error('❌ Failed to save jig assignment:', error)
          } else {
            const result = await response.json()
            console.log('✅ Jig assignment saved to database:', result)
          }
        } catch (error) {
          console.error('❌ Error saving jig assignment to database:', error)
        }
      },

      handleUpdateJigAssignment: async (assignmentId, updates) => {
        const { jigA } = get()

        // Update local state immediately
        const updatedJigA = jigA.map(g =>
          g.id === assignmentId ? { ...g, ...updates } : g
        )
        set({ jigA: updatedJigA })

        // Sync to database
        try {
          const response = await fetch(`/api/jigs/${assignmentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Failed to update jig assignment:', error)
          }
        } catch (error) {
          console.error('Failed to update jig assignment in database:', error)
        }
      },

      handleCompleteJig: async (jigName) => {
        const { jigA, jobs } = get()
        const now = Date.now()

        // Get all active assignments for this jig
        const activeAssignments = jigA.filter(g => g.jigName === jigName && g.status === 'ACTIVE')
        const jigJobIds = activeAssignments.map(g => g.jobId)

        // Mark assignments as CLEARED in local state
        const updatedJigA = jigA.map(g =>
          g.jigName === jigName && g.status === 'ACTIVE'
            ? { ...g, status: 'CLEARED' as const, completedAt: now }
            : g
        )

        // Mark all jobs on this jig as PO complete (ready for dispatch)
        const updatedJobs = jobs.map(j =>
          jigJobIds.includes(j.id) ? { ...j, poComplete: true } : j
        )

        set({ jigA: updatedJigA, jobs: updatedJobs })

        // Sync to database
        try {
          // Mark all jig assignments as CLEARED
          for (const assignment of activeAssignments) {
            await fetch(`/api/jigs/${assignment.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'CLEARED', completedAt: now }),
            })
          }

          // Update all jobs to mark as complete
          for (const jobId of jigJobIds) {
            await fetch(`/api/jobs/${jobId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ poComplete: true }),
            })
          }
        } catch (error) {
          console.error('Failed to complete jig in database:', error)
        }
      },

      handleSendBackJob: async (jobId) => {
        const { jigA, jobs } = get()
        const assignmentsToDelete = jigA.filter(g => g.jobId === jobId)

        // Remove all JIG assignments for this job
        const updatedJigA = jigA.filter(g => g.jobId !== jobId)
        // Reset poComplete status
        const updatedJobs = jobs.map(j =>
          j.id === jobId ? { ...j, poComplete: false } : j
        )
        set({ jigA: updatedJigA, jobs: updatedJobs })

        // Sync to database
        try {
          // Delete all jig assignments for this job
          for (const assignment of assignmentsToDelete) {
            await fetch(`/api/jigs/${assignment.id}`, {
              method: 'DELETE',
            })
          }

          // Update job
          await fetch(`/api/jobs/${jobId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poComplete: false }),
          })
        } catch (error) {
          console.error('Failed to send back job in database:', error)
        }
      },

      // Dispatch actions
      handleDispatch: async (job, invoiceNumber) => {
        const { invSeq } = get()
        await get().handleUpdateJob(job)
        if (invoiceNumber !== 'INTERNAL') {
          const newSeq = invSeq + 1
          set({ invSeq: newSeq })

          // Update settings in database
          try {
            await fetch('/api/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ invSeq: newSeq }),
            })
          } catch (error) {
            console.error('Failed to update invoice sequence in database:', error)
          }
        }
      },

      handleRemoveFromDispatch: async (jobId) => {
        const { jobs } = get()
        const updatedJobs = jobs.map(j =>
          j.id === jobId ? { ...j, dispatchedAt: null, invoiceNumber: null } : j
        )
        set({ jobs: updatedJobs })

        // Sync to database
        try {
          await fetch(`/api/jobs/${jobId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dispatchedAt: null, invoiceNumber: null }),
          })
        } catch (error) {
          console.error('Failed to remove job from dispatch in database:', error)
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
    // PERSIST DISABLED - Uncomment below to re-enable localStorage
    // {
    //   name: 'tze-storage',
    //   partialize: (state) => ({
    //     jobs: state.jobs,
    //     jigA: state.jigA,
    //     jigPhotos: state.jigPhotos,
    //     invSeq: state.invSeq,
    //     nextTZE: getNextTZE(),
    //   }),
    // }
    // ),  // <- Add this closing paren when re-enabling persist
    { name: 'TZE Store' }
  )
)
