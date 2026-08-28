import { randomBytes } from "crypto"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import type { TUserRole } from "@/types/types"

const SESSION_COOKIE = "session"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

export interface ISessionUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: TUserRole
}

/**
 * Creates a DB-backed session and sets the session cookie. Sessions are
 * DB-backed (not JWTs) so deleting a Session/User row instantly revokes
 * access — required for offboarding staff who leave the company.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)

  await prisma.session.create({
    data: { token, userId, expiresAt },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

/**
 * Resolves the current session cookie to its user, or null if missing/expired.
 */
export async function getSession(): Promise<{ user: ISessionUser } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) return null

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role as TUserRole,
    },
  }
}

/**
 * Deletes the current session row and clears the cookie (sign-out).
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export function isAdmin(role: TUserRole | undefined | null): boolean {
  return role === "admin"
}
