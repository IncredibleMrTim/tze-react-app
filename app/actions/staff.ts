'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createInvitation, revokeInvitation, deleteUser } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { getSession, isAdmin } from '@/lib/session'
import type { TUserRole } from '@/types/types'

const INVITATION_EXPIRY_DAYS = 7

/**
 * Invites a new staff member by email. Only callable by an existing admin —
 * this is the only way new accounts get created, since sign-up is invitation-only.
 */
export async function inviteStaffAction(email: string, role: TUserRole) {
  const session = await getSession()
  if (!isAdmin(session?.user.role)) {
    return { success: false, error: 'Not authorized' }
  }

  try {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    await createInvitation(email, role, token, expiresAt)

    const registerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${token}`
    await sendEmail({
      to: email,
      subject: 'You’ve been invited to TZE',
      html: `<p>You've been invited to join the TZE job-tracking system.</p><p><a href="${registerUrl}">Click here to set up your account</a>.</p><p>This link expires in ${INVITATION_EXPIRY_DAYS} days.</p>`,
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to invite staff member:', error)
    return { success: false, error: 'Failed to send invitation' }
  }
}

/**
 * Revokes a pending invitation before it's accepted.
 */
export async function revokeInvitationAction(invitationId: string) {
  const session = await getSession()
  if (!isAdmin(session?.user.role)) {
    return { success: false, error: 'Not authorized' }
  }

  try {
    await revokeInvitation(invitationId)
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to revoke invitation:', error)
    return { success: false, error: 'Failed to revoke invitation' }
  }
}

/**
 * Removes a staff member's account. Cascades to their credentials and
 * sessions, logging them out everywhere immediately.
 */
export async function deactivateStaffAction(userId: string) {
  const session = await getSession()
  if (!isAdmin(session?.user.role)) {
    return { success: false, error: 'Not authorized' }
  }

  try {
    await deleteUser(userId)
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to remove staff member:', error)
    return { success: false, error: 'Failed to remove staff member' }
  }
}
