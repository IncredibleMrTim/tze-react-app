'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { createJob, updateJob, deleteJob, getJobs, getOnFloorJobs } from '@/lib/db'
import type { IJob } from '@/types/interfaces'

export async function createJobAction(job: IJob) {
  try {
    const result = await createJob(job)
    revalidatePath('/intake')
    return result
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      (error.meta?.target as string[] | undefined)?.includes('po_number')
    ) {
      throw new Error('PO number already exists', { cause: error })
    }
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
    const jobs = await getJobs()
    return { success: true, jobs }
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return { success: false, jobs: [], error: 'Failed to fetch jobs' }
  }
}

export async function getOnFloorJobsAction(params: { cursor?: string; take?: number } = {}) {
  try {
    const result = await getOnFloorJobs(params)
    return { success: true, ...result }
  } catch (error) {
    console.error('Failed to fetch on-floor jobs:', error)
    return { success: false, jobs: [], nextCursor: null, totalCount: 0, error: 'Failed to fetch on-floor jobs' }
  }
}
