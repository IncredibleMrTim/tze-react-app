import { NextRequest, NextResponse } from "next/server"
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from "@simplewebauthn/server"
import { verifyAuthenticationResponse } from "@simplewebauthn/server"
import { getCredentialByCredentialId, updateCredentialCounter } from "@/lib/db"
import { createSession } from "@/lib/session"
import { rpID, origin, getChallengeCookie, clearChallengeCookie } from "@/lib/webauthn"

export async function POST(request: NextRequest) {
  try {
    const response = (await request.json()) as AuthenticationResponseJSON

    const challengeData = await getChallengeCookie()
    if (!challengeData) {
      return NextResponse.json({ error: "Sign-in session expired" }, { status: 400 })
    }

    const credential = await getCredentialByCredentialId(response.id)
    if (!credential) {
      return NextResponse.json({ error: "Passkey not recognized" }, { status: 400 })
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(credential.publicKey),
        counter: Number(credential.counter),
        transports: credential.transports as AuthenticatorTransportFuture[],
      },
    })

    if (!verification.verified) {
      return NextResponse.json({ error: "Passkey verification failed" }, { status: 400 })
    }

    await updateCredentialCounter(credential.credentialId, verification.authenticationInfo.newCounter)
    await createSession(credential.userId)
    await clearChallengeCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to verify authentication:", error)
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}
