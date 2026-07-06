'use client'

import { useEffect, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import type { IJob, IJigAssignment } from '@/types/interfaces'

export function useDbSync() {
  const { setJobs, setJigA, setInvSeq, setSettings } = useStore()

  // Load all data from database on mount
  const loadFromDb = useCallback(async () => {
    try {
      // Load jobs
      const jobsRes = await fetch('/api/jobs')
      if (jobsRes.ok) {
        const jobs = await jobsRes.json()
        setJobs(jobs)
      }

      // Load jig assignments
      const jigsRes = await fetch('/api/jigs')
      if (jigsRes.ok) {
        const jigs = await jigsRes.json()
        setJigA(jigs)
      }

      // Load settings
      const settingsRes = await fetch('/api/settings')
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setSettings({
          apiKey: settings.apiKey,
          silverKg: settings.silverKg,
          goldKg: settings.goldKg,
          silverJig: settings.silverJig,
          goldJig: settings.goldJig,
          dueDays: settings.dueDays,
          jigCount: settings.jigCount,
          invSeqStart: settings.invSeqStart,
          stringRate: settings.stringRate,
        })
        setInvSeq(settings.invSeq)
      }

      console.log('✓ Data loaded from database')
    } catch (error) {
      console.error('Error loading data from database:', error)
    }
  }, [setJobs, setJigA, setInvSeq, setSettings])

  // Save job to database
  const saveJob = useCallback(async (job: IJob) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      })

      if (!res.ok) {
        throw new Error('Failed to save job')
      }

      return await res.json()
    } catch (error) {
      console.error('Error saving job:', error)
      throw error
    }
  }, [])

  // Update job in database
  const updateJob = useCallback(async (jobId: string, updates: Partial<IJob>) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        throw new Error('Failed to update job')
      }

      return await res.json()
    } catch (error) {
      console.error('Error updating job:', error)
      throw error
    }
  }, [])

  // Delete job from database
  const deleteJob = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete job')
      }

      return await res.json()
    } catch (error) {
      console.error('Error deleting job:', error)
      throw error
    }
  }, [])

  // Save jig assignment to database
  const saveJigAssignment = useCallback(async (assignment: IJigAssignment) => {
    try {
      const res = await fetch('/api/jigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      })

      if (!res.ok) {
        throw new Error('Failed to save jig assignment')
      }

      return await res.json()
    } catch (error) {
      console.error('Error saving jig assignment:', error)
      throw error
    }
  }, [])

  return {
    loadFromDb,
    saveJob,
    updateJob,
    deleteJob,
    saveJigAssignment,
  }
}
