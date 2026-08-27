"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";

interface RegisterClientProps {
  token: string;
  email: string;
}

export default function RegisterClient({ token, email }: RegisterClientProps) {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setIsRegistering(true);
    setError(null);

    try {
      const optionsResponse = await fetch("/api/auth/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const options = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(options.error ?? "Failed to start registration");

      const registrationResponse = await startRegistration({ optionsJSON: options });

      const verifyResponse = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationResponse),
      });
      const result = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(result.error ?? "Failed to complete registration");

      router.push("/intake");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <h2 className="text-lg font-bold">Set Up Your Account</h2>
      <p className="text-sm text-gray-600">
        Register a passkey for <span className="font-medium">{email}</span> to
        finish setting up your account.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleRegister}
        disabled={isRegistering}
        className="w-full bg-primary text-white rounded-xl py-3 text-base font-semibold disabled:opacity-50"
      >
        {isRegistering ? "Registering..." : "Register Passkey"}
      </button>
    </div>
  );
}
