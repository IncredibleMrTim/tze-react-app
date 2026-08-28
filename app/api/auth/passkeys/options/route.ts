import { NextResponse } from "next/server"
import { generateRegistrationOptions } from "@simplewebauthn/server"
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server"
import { getCredentialsByUserId } from "@/lib/db"
import { getSession } from "@/lib/session"
import { rpName, rpID, setChallengeCookie } from "@/lib/webauthn"

/**
 * Starts a ceremony for an already-signed-in user to register an additional
 * passkey (a new device/browser) on their existing account. Unlike
 * /api/auth/register, this doesn't create a new User — it's gated by session,
 * not an invitation token.
 */
export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const existingCredentials = await getCredentialsByUserId(session.user.id)

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: session.user.email,
      userDisplayName: session.user.email,
      attestationType: "none",
      excludeCredentials: existingCredentials.map((credential) => ({
        id: credential.credentialId,
        transports: credential.transports as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
    })

    await setChallengeCookie({ challenge: options.challenge, userId: session.user.id })

    return NextResponse.json(options)
  } catch (error) {
    console.error("Failed to generate passkey options:", error)
    return NextResponse.json({ error: "Failed to start passkey registration" }, { status: 500 })
  }
}
