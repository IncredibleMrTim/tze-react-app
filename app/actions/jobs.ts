'use server'

import { revalidatePath } from 'next/cache'
import { updateJob, deleteJob } from '@/lib/db'
import type { IJob } from '@/types/interfaces'

const PYTHON_API_URL = process.env.PYTHON_API_URL

export async function createJobAction(job: IJob) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    })
    if (!response.ok) {
      throw new Error(`Python API responded with ${response.status}`)
    }
    const result = await response.json()
    revalidatePath('/intake')
    return result
  } catch (error) {
    console.error('Failed to create job:', error)
    console.error('Job data size:', JSON.stringify(job).length, 'characters')
    console.error('PO pages count:', job.poPages?.length || 0)
    console.error('Parts photos count:', job.partsOnArrivalPhotos?.length || 0)
    throw error
  }
}

export async function updateJobAction(jobId: string, updates: Partial<IJob>) {
  const result = await updateJob(jobId, updates)
  revalidatePath('/intake')
  revalidatePath('/jig')
  revalidatePath('/dispatch')
  return result
}

export async function deleteJobAction(jobId: string) {
  try {
    await deleteJob(jobId)
    revalidatePath('/intake')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete job:', error)
    return { success: false, error: 'Failed to delete job' }
  }
}

export async function getJobsAction() {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/jobs`, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Python API responded with ${response.status}`)
    }
    const jobs = await response.json()
    return { success: true, jobs }
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return { success: false, jobs: [], error: 'Failed to fetch jobs' }
  }
}
