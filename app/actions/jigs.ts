'use server'

import { revalidatePath } from 'next/cache'
import {
  createJigAssignment,
  updateJigAssignment,
  deleteJigAssignment,
  getJigAssignments,
  deleteJigAssignmentsByJobId,
  updateJob,
  setJigRework,
} from '@/lib/db'
import type { IJigAssignment } from '@/types/interfaces'

export async function createJigAssignmentAction(assignment: IJigAssignment) {
  try {
    const result = await createJigAssignment(assignment)
    revalidatePath('/jig')
    revalidatePath('/intake')
    revalidatePath('/jobs')
    return { success: true, assignment: result }
  } catch (error) {
    console.error('Failed to create jig assignment:', error)
    return { success: false, error: 'Failed to create jig assignment' }
  }
}

export async function updateJigAssignmentAction(
  assignmentId: string,
  updates: Partial<IJigAssignment>
) {
  try {
    const result = await updateJigAssignment(assignmentId, updates)
    revalidatePath('/jig')
    revalidatePath('/intake')
    revalidatePath('/jobs')
    return { success: true, assignment: result }
  } catch (error) {
    console.error('Failed to update jig assignment:', error)
    return { success: false, error: 'Failed to update jig assignment' }
  }
}

export async function deleteJigAssignmentAction(assignmentId: string) {
  try {
    await deleteJigAssignment(assignmentId)
    revalidatePath('/jig')
    revalidatePath('/intake')
    revalidatePath('/jobs')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete jig assignment:', error)
    return { success: false, error: 'Failed to delete jig assignment' }
  }
}

export async function clearJobJigsAction(jobId: string) {
  try {
    await deleteJigAssignmentsByJobId(jobId)
    // Sending a job back for re-jigging means its parts aren't processed
    // yet, so it needs to be assignable to a jig again
    await updateJob(jobId, { poComplete: false })
    revalidatePath('/jig')
    revalidatePath('/intake')
    revalidatePath('/jobs')
    return { success: true }
  } catch (error) {
    console.error('Failed to clear job jigs:', error)
    return { success: false, error: 'Failed to clear job jigs' }
  }
}

export async function completeJigAction(jigName: string) {
  try {
    const assignments = await getJigAssignments()
    const activeAssignments = assignments.filter(
      (a) => a.jigName === jigName && a.status === 'ACTIVE'
    )

    const now = Date.now()

    // Mark all assignments as CLEARED
    for (const assignment of activeAssignments) {
      await updateJigAssignment(assignment.id, {
        status: 'CLEARED',
        completedAt: now,
      })
    }

    // Mark jobs as complete, unless they're still spread across another
    // jig that hasn't been cleared yet
    for (const assignment of activeAssignments) {
      const stillActiveElsewhere = assignments.some(
        (a) =>
          a.jobId === assignment.jobId &&
          a.status === 'ACTIVE' &&
          a.id !== assignment.id
      )
      if (!stillActiveElsewhere) {
        await updateJob(assignment.jobId, { poComplete: true })
      }
    }

    // Reset the rework flag so the next load cycle on this jig starts clean
    await setJigRework(jigName, false)

    revalidatePath('/jig')
    revalidatePath('/intake')
    revalidatePath('/jobs')
    revalidatePath('/dispatch')

    return { success: true }
  } catch (error) {
    console.error('Failed to complete jig:', error)
    return { success: false, error: 'Failed to complete jig' }
  }
}

export async function getJigAssignmentsAction() {
  try {
    const assignments = await getJigAssignments()
    return { success: true, assignments }
  } catch (error) {
    console.error('Failed to fetch jig assignments:', error)
    return { success: false, assignments: [], error: 'Failed to fetch jig assignments' }
  }
}
