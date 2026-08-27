import { NextResponse } from "next/server"
import { generateAuthenticationOptions } from "@simplewebauthn/server"
import { rpID, setChallengeCookie } from "@/lib/webauthn"

export async function POST() {
  try {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
    })

    await setChallengeCookie({ challenge: options.challenge })

    return NextResponse.json(options)
  } catch (error) {
    console.error("Failed to generate authentication options:", error)
    return NextResponse.json({ error: "Failed to start sign-in" }, { status: 500 })
  }
}
