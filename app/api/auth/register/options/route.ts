import { NextRequest, NextResponse } from "next/server"
import { generateRegistrationOptions } from "@simplewebauthn/server"
import { getInvitationByToken } from "@/lib/db"
import { rpName, rpID, setChallengeCookie } from "@/lib/webauthn"

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as { token?: string }
    if (!token) {
      return NextResponse.json({ error: "Missing invitation token" }, { status: 400 })
    }

    const invitation = await getInvitationByToken(token)
    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: invitation.email,
      userDisplayName: invitation.email,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
    })

    await setChallengeCookie({ challenge: options.challenge, invitationToken: token })

    return NextResponse.json(options)
  } catch (error) {
    console.error("Failed to generate registration options:", error)
    return NextResponse.json({ error: "Failed to start registration" }, { status: 500 })
  }
}
