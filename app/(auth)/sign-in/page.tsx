"use client"

import { useState } from "react"
import { startAuthentication } from "@simplewebauthn/browser"
import { Logo } from "@/components/Logo"

export default function SignInPage() {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    setError(null)

    try {
      const optionsResponse = await fetch("/api/auth/login/options", {
        method: "POST",
      })
      const options = await optionsResponse.json()
      if (!optionsResponse.ok)
        throw new Error(options.error ?? "Failed to start sign-in")

      const authenticationResponse = await startAuthentication({
        optionsJSON: options,
      })

      const verifyResponse = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authenticationResponse),
      })
      const result = await verifyResponse.json()
      if (!verifyResponse.ok)
        throw new Error(result.error ?? "Failed to sign in")

      // Hard navigation, not router.push — the session cookie was just set
      // by the verify request above, and a client-side soft nav can race
      // with the router cache and hit middleware before it sees the new
      // cookie, bouncing back to /sign-in.
      window.location.href = "/intake"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 text-center h-full">
      <Logo className="h-48" />

      <h2 className="text-md text-gray-600">
        Sign in with the passkey registered to your account.
      </h2>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="w-full bg-primary text-white rounded-xl py-3 text-base font-semibold disabled:opacity-50"
      >
        {isSigningIn ? "Signing in..." : "Sign in with Passkey"}
      </button>
      <p className="text-sm text-gray-600">
        {`If you are authorised to use this app, check your email for a
        registration link.`}
      </p>
    </div>
  )
}
