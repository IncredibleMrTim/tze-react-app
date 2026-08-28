"use client";

import { useState, useTransition } from "react";
import { inviteStaffAction, revokeInvitationAction, deactivateStaffAction } from "@/actions/staff";
import { useToast } from "@/hooks/useToast";
import type { IPendingInvitation, IStaffMember } from "@/types/interfaces";
import type { TUserRole } from "@/types/types";

interface UsersTabProps {
  staff: IStaffMember[];
  pendingInvitations: IPendingInvitation[];
}

export default function UsersTab({ staff, pendingInvitations }: UsersTabProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TUserRole>("staff");

  const handleInvite = () => {
    if (!email.trim()) return;

    startTransition(async () => {
      const result = await inviteStaffAction(email.trim(), role);
      if (result.success) {
        showToast("Invitation sent");
        setEmail("");
        setRole("staff");
      } else {
        showToast(result.error ?? "Failed to send invitation");
      }
    });
  };

  const handleRevoke = (invitationId: string) => {
    startTransition(async () => {
      const result = await revokeInvitationAction(invitationId);
      showToast(result.success ? "Invitation revoked" : "Failed to revoke invitation");
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      const result = await deactivateStaffAction(userId);
      showToast(result.success ? "Staff member removed" : "Failed to remove staff member");
    });
  };

  return (
    <div>
      <div className="pt-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">Invite Staff Member</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TUserRole)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={handleInvite}
            disabled={isPending || !email.trim()}
            className="w-full bg-primary text-white rounded-xl py-3 text-base font-semibold disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </div>

      {pendingInvitations.length > 0 && (
        <div className="border-t pt-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">Pending Invitations</h3>
          <div className="flex flex-col gap-2">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between border border-gray-200 rounded px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{invitation.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{invitation.role}</p>
                </div>
                <button
                  onClick={() => handleRevoke(invitation.id)}
                  disabled={isPending}
                  className="text-xs text-red-600 font-medium disabled:opacity-50"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">
          Active Staff ({staff.length})
        </h3>
        <div className="flex flex-col gap-2">
          {staff.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between border border-gray-200 rounded px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">
                  {member.firstName || member.lastName
                    ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()
                    : member.email}
                </p>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 capitalize">{member.role}</span>
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={isPending}
                  className="text-xs text-red-600 font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
