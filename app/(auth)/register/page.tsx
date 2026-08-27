import { getInvitationByToken } from "@/lib/db";
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const invitation = token ? await getInvitationByToken(token) : null;
  const isValid =
    !!invitation && !invitation.acceptedAt && invitation.expiresAt > new Date();

  if (!token || !isValid) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
        <h2 className="text-lg font-bold">Invitation Invalid</h2>
        <p className="text-sm text-gray-600">
          This invitation link is invalid, expired, or has already been used.
          Ask an admin to send you a new one.
        </p>
      </div>
    );
  }

  return <RegisterClient token={token} email={invitation.email} />;
}
