'use server'

import { revalidatePath } from 'next/cache'
import { updateJob, updateSettings, getSettings } from '@/lib/db'
import type { IJob } from '@/types/interfaces'

export async function dispatchJobAction(job: IJob, invoiceNumber: string) {
  try {
    // Update job with dispatch info
    await updateJob(job.id, {
      ...job,
      dispatchedAt: job.dispatchedAt,
      invoiceNumber: job.invoiceNumber,
      fpnDownloaded: job.fpnDownloaded,
      csvDownloaded: job.csvDownloaded,
    })

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
    return { success: false, error: 'Failed to dispatch job' }
  }
}
