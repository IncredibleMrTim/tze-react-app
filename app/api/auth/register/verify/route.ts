import { NextRequest, NextResponse } from "next/server"
import type { RegistrationResponseJSON } from "@simplewebauthn/server"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import { createUser, createCredential, markInvitationAccepted, getInvitationByToken } from "@/lib/db"
import { createSession } from "@/lib/session"
import { rpID, origin, getChallengeCookie, clearChallengeCookie } from "@/lib/webauthn"

export async function POST(request: NextRequest) {
  try {
    const response = (await request.json()) as RegistrationResponseJSON

    const challengeData = await getChallengeCookie()
    if (!challengeData?.invitationToken) {
      return NextResponse.json({ error: "Registration session expired" }, { status: 400 })
    }

    const invitation = await getInvitationByToken(challengeData.invitationToken)
    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Passkey verification failed" }, { status: 400 })
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    const user = await createUser(invitation.email, invitation.role)
    await createCredential({
      userId: user.id,
      credentialId: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    })
    await markInvitationAccepted(invitation.id)
    await createSession(user.id)
    await clearChallengeCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to verify registration:", error)
    return NextResponse.json({ error: "Failed to complete registration" }, { status: 500 })
  }
}
