'use server'

import { revalidatePath } from 'next/cache'
import { updateJob, updateSettings, getSettings, getActiveJigAssignments } from '@/lib/db'
import type { IJob } from '@/types/interfaces'

export async function dispatchJobAction(job: IJob, invoiceNumber: string) {
  try {
    // Guard against dispatching while the job is still loaded on another
    // jig that hasn't been cleared yet — the UI already filters these out,
    // but this keeps the rule enforced even if a stale client bypasses it
    const activeAssignments = await getActiveJigAssignments(job.id)
    if (activeAssignments.length > 0) {
      throw new Error(
        `Job is still active on ${activeAssignments.length > 1 ? 'jigs' : 'a jig'} that ${activeAssignments.length > 1 ? 'are' : 'is'} not yet complete`
      )
    }

    // PO complete is a manual toggle set by staff — a job can't be
    // dispatched until it's explicitly confirmed complete
    if (!job.poComplete) {
      throw new Error('Job cannot be dispatched until PO complete is toggled on')
    }

    // Exclude any relation fields that might be attached (from query cache)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { jigAssignments, ...jobData } = job as IJob & { jigAssignments?: unknown }

    // Update job with dispatch info
    await updateJob(job.id, jobData)

    // Increment invoice sequence if not INTERNAL
    if (invoiceNumber !== 'INTERNAL') {
      const settings = await getSettings()
      await updateSettings({ invSeq: settings.invSeq + 1 })
    }

    revalidatePath('/dispatch')
    revalidatePath('/intake')
    return { success: true }
  } catch (error) {
    console.error('Failed to dispatch job:', error)
    throw new Error('Failed to dispatch job', { cause: error })
  }
}
