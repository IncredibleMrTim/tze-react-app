'use server'

import { revalidatePath } from 'next/cache'
import {
  createJigAssignment,
  updateJigAssignment,
  deleteJigAssignment,
  getJigAssignments,
  getActiveJigAssignments,
  getActiveJigAssignmentsByJig,
  updateJob,
  getJigPhoto,
  clearCurrentJigPhoto,
  deleteJigRework,
  clearJigStateIfEmpty,
  ensureJigsExist,
  getSettings,
} from '@/lib/db'
import type { IJigAssignment } from '@/types/interfaces'

export async function getJigsAction() {
  try {
    const settings = await getSettings()
    const jigs = await ensureJigsExist(settings.jigCount)
    return { success: true, jigs }
  } catch (error) {
    console.error('Failed to fetch jigs:', error)
    return { success: false, jigs: [], error: 'Failed to fetch jigs' }
  }
}

export async function createJigAssignmentAction(assignment: IJigAssignment) {
  try {
    const result = await createJigAssignment(assignment)
    revalidatePath('/jig')
    revalidatePath('/intake')
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
    return { success: true, assignment: result }
  } catch (error) {
    console.error('Failed to update jig assignment:', error)
    return { success: false, error: 'Failed to update jig assignment' }
  }
}

export async function deleteJigAssignmentAction(assignmentId: string) {
  try {
    const deleted = await deleteJigAssignment(assignmentId)

    // A job can also leave a jig this way (not just via "complete") — if
    // that empties the jig out, its photo/rework must be cleared too,
    // otherwise the next unrelated job assigned to this jig inherits a
    // photo taken for this job's parts.
    if (deleted) {
      await clearJigStateIfEmpty(deleted.jigId)
    }

    revalidatePath('/jig')
    revalidatePath('/intake')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete jig assignment:', error)
    return { success: false, error: 'Failed to delete jig assignment' }
  }
}

export async function clearJobJigsAction(jobId: string) {
  try {
    const activeAssignments = await getActiveJigAssignments(jobId)
    const jigIds = Array.from(new Set(activeAssignments.map((a) => a.jigId)))

    // Mark active assignments CLEARED (same pattern as completeJigAction)
    // instead of deleting them — cleared assignments are the job's
    // permanent jig photo history, so sending it back for another run
    // must not erase this run's photo along with the still-active one.
    const now = Date.now()

    // Fetch each jig's photo once (not once per assignment — a job can
    // have multiple assignments on the same jig) and in parallel.
    const photoEntries = await Promise.all(
      jigIds.map(async (jigId) => [jigId, await getJigPhoto(jigId)] as const)
    )
    const photoByJigId = new Map(photoEntries)

    await Promise.all(
      activeAssignments.map((assignment) =>
        updateJigAssignment(assignment.id, {
          status: 'CLEARED',
          completedAt: now,
          photoId: photoByJigId.get(assignment.jigId)?.id ?? null,
        })
      )
    )

    // Sending a job back for re-jigging means its parts aren't processed
    // yet, so it needs to be assignable to a jig again
    await updateJob(jobId, { poComplete: false })

    // Must run after the status updates above have committed —
    // clearJigStateIfEmpty counts still-ACTIVE assignments per jig, so
    // running it concurrently with those writes could race on a stale count.
    await Promise.all(jigIds.map((jigId) => clearJigStateIfEmpty(jigId)))

    revalidatePath('/jig')
    revalidatePath('/intake')
    return { success: true }
  } catch (error) {
    console.error('Failed to clear job jigs:', error)
    return { success: false, error: 'Failed to clear job jigs' }
  }
}

export async function completeJigAction(jigId: string) {
  try {
    const activeAssignments = await getActiveJigAssignmentsByJig(jigId)

    const now = Date.now()
    const photo = await getJigPhoto(jigId)

    // Mark all assignments as CLEARED, pointing each at the jig's current
    // reference photo by id — the photo row itself stays put as permanent
    // history (JigPhoto is append-only), so it remains visible for these
    // jobs even after the jig's next load cycle gets its own new photo
    await Promise.all(
      activeAssignments.map((assignment) =>
        updateJigAssignment(assignment.id, {
          status: 'CLEARED',
          completedAt: now,
          photoId: photo?.id ?? null,
        })
      )
    )

    // Note: completing a jig does NOT mark the job's PO as complete.
    // A job may still need further work on another jig, so poComplete
    // stays a manual toggle set by staff in the assignment drawer/modal —
    // clearing this jig's assignments must not block re-adding the job
    // elsewhere.

    // Reset the rework flag and disassociate the jig's current photo so
    // the next load cycle starts clean. The photo row itself is not
    // deleted — it's still referenced by the cleared assignments above
    // via photoId, and stays available as their permanent history.
    await deleteJigRework(jigId)
    await clearCurrentJigPhoto(jigId)

    revalidatePath('/jig')
    revalidatePath('/intake')
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
