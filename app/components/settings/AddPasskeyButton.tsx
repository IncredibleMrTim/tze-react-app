"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { useToast } from "@/hooks/useToast";

/**
 * Lets an already-signed-in user register an additional passkey (e.g. a new
 * phone, or this browser on a device they haven't used before) on their
 * existing account, without needing a fresh invitation.
 */
export default function AddPasskeyButton() {
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPasskey = async () => {
    setIsAdding(true);

    try {
      const optionsResponse = await fetch("/api/auth/passkeys/options", {
        method: "POST",
      });
      const options = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(options.error ?? "Failed to start passkey registration");

      const registrationResponse = await startRegistration({ optionsJSON: options });

      const verifyResponse = await fetch("/api/auth/passkeys/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationResponse),
      });
      const result = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(result.error ?? "Failed to add passkey");

      showToast("Passkey added for this device");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add passkey");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="border-t pt-4 mb-4">
      <h3 className="text-sm font-semibold mb-3">Passkeys</h3>
      <p className="text-xs text-gray-500 mb-3">
        Add a passkey for this device so you can sign in with it directly.
      </p>
      <button
        onClick={handleAddPasskey}
        disabled={isAdding}
        className="w-full border border-gray-300 rounded-xl py-3 text-base font-semibold disabled:opacity-50"
      >
        {isAdding ? "Adding passkey..." : "Add a passkey on this device"}
      </button>
    </div>
  );
}
