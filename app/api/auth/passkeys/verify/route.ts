import { NextRequest, NextResponse } from "next/server"
import type { RegistrationResponseJSON } from "@simplewebauthn/server"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import { createCredential } from "@/lib/db"
import { getSession } from "@/lib/session"
import { rpID, origin, getChallengeCookie, clearChallengeCookie } from "@/lib/webauthn"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const response = (await request.json()) as RegistrationResponseJSON

    const challengeData = await getChallengeCookie()
    if (!challengeData || challengeData.userId !== session.user.id) {
      return NextResponse.json({ error: "Passkey session expired" }, { status: 400 })
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

    await createCredential({
      userId: session.user.id,
      credentialId: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    })
    await clearChallengeCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to verify passkey registration:", error)
    return NextResponse.json({ error: "Failed to add passkey" }, { status: 500 })
  }
}
