'use server'

import { revalidatePath } from 'next/cache'
import { createJob, updateJob, deleteJob, getJobs } from '@/lib/db'
import { broadcastEvent } from '@/lib/pusher-server'
import type { IJob } from '@/types/interfaces'

export async function createJobAction(job: IJob) {
  try {
    const result = await createJob(job)
    revalidatePath('/intake')
    revalidatePath('/jobs')

    // Broadcast to all connected clients
    await broadcastEvent('jobs', 'job:created', result)

    return { success: true, job: result }
  } catch (error) {
    console.error('Failed to create job:', error)
    return { success: false, error: 'Failed to create job' }
  }
}

export async function updateJobAction(jobId: string, updates: Partial<IJob>) {
  try {
    const result = await updateJob(jobId, updates)
    revalidatePath('/intake')
    revalidatePath('/jobs')
    revalidatePath('/jig')
    revalidatePath('/dispatch')

    // Broadcast to all connected clients
    await broadcastEvent('jobs', 'job:updated', result)

    return { success: true, job: result }
  } catch (error) {
    console.error('Failed to update job:', error)
    return { success: false, error: 'Failed to update job' }
  }
}

export async function deleteJobAction(jobId: string) {
  try {
    await deleteJob(jobId)
    revalidatePath('/intake')
    revalidatePath('/jobs')

    // Broadcast to all connected clients
    await broadcastEvent('jobs', 'job:deleted', { jobId })

    return { success: true }
  } catch (error) {
    console.error('Failed to delete job:', error)
    return { success: false, error: 'Failed to delete job' }
  }
}

export async function getJobsAction() {
  try {
    const jobs = await getJobs()
    return { success: true, jobs }
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return { success: false, jobs: [], error: 'Failed to fetch jobs' }
  }
}
