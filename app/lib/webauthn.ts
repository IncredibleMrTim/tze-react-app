import { cookies } from "next/headers"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const rpName = "Tauranga Zinc Electroplaters"
export const rpID = new URL(appUrl).hostname
export const origin = appUrl

const CHALLENGE_COOKIE = "webauthn_challenge"
const CHALLENGE_MAX_AGE_SECONDS = 300

interface IChallengeData {
  challenge: string
  invitationToken?: string
}

/**
 * Stores the WebAuthn challenge between the options and verify steps of a
 * ceremony. Only needs to survive one immediate round trip on the same
 * browser, so a short-lived cookie is sufficient — no DB row needed.
 */
export async function setChallengeCookie(data: IChallengeData): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CHALLENGE_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_MAX_AGE_SECONDS,
  })
}

export async function getChallengeCookie(): Promise<IChallengeData | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(CHALLENGE_COOKIE)?.value
  if (!raw) return null
  return JSON.parse(raw) as IChallengeData
}

export async function clearChallengeCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CHALLENGE_COOKIE)
}
