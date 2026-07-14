'use server'

import { revalidatePath } from 'next/cache'
import { updateJob, updateSettings, getSettings } from '@/lib/db'
import type { IJob } from '@/types/interfaces'

export async function dispatchJobAction(job: IJob, invoiceNumber: string) {
  try {
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
    revalidatePath('/jobs')
    revalidatePath('/intake')
    return { success: true }
  } catch (error) {
    console.error('Failed to dispatch job:', error)
    throw new Error('Failed to dispatch job', { cause: error })
  }
}
