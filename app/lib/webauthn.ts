import { cookies } from "next/headers"

// Preview deployments don't have a fixed URL to put in NEXT_PUBLIC_APP_URL
// (a new one is minted per deployment), so WebAuthn's rpID/origin would
// mismatch on every push. VERCEL_BRANCH_URL is stable across all
// deployments of the same git branch, so preview passkeys keep working
// without touching env vars. Production still relies on the explicit
// NEXT_PUBLIC_APP_URL since it must match the real custom domain.
export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000"

export const rpName = "Tauranga Zinc Electroplaters"
export const rpID = new URL(appUrl).hostname
export const origin = appUrl

const CHALLENGE_COOKIE = "webauthn_challenge"
const CHALLENGE_MAX_AGE_SECONDS = 300

interface IChallengeData {
  challenge: string
  invitationToken?: string
  userId?: string
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
