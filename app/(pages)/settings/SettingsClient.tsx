"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettingsAction } from "@/actions/settings";
import { useToast } from "@/hooks/useToast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { IPendingInvitation, ISettings, IStaffMember } from "@/types/interfaces";
import AddPasskeyButton from "@/components/settings/AddPasskeyButton";
import UsersTab from "./UsersTab";

type SettingsClientProps =
  | { initialSettings: ISettings; isAdmin: false }
  | {
      initialSettings: ISettings;
      isAdmin: true;
      staff: IStaffMember[];
      pendingInvitations: IPendingInvitation[];
    };

export default function SettingsClient(props: SettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { showToast } = useToast();
  const [settings, setSettings] = useState(props.initialSettings);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSettingsAction(settings);
      if (result.success) {
        showToast("Settings saved");
      } else {
        showToast("Failed to save settings");
      }
    });
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  };

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
  ) => {
    setSettings({ ...settings, [key]: value });
  };

  const settingsForm = (
    <div>
      <div className="pt-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">Rate Card</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Silver $/kg
            </label>
            <input
              type="number"
              value={settings.silverKg}
              onChange={(e) =>
                updateSetting("silverKg", parseFloat(e.target.value) || 0)
              }
              step="0.1"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Gold $/kg
            </label>
            <input
              type="number"
              value={settings.goldKg}
              onChange={(e) =>
                updateSetting("goldKg", parseFloat(e.target.value) || 0)
              }
              step="0.1"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Silver JIG $
            </label>
            <input
              type="number"
              value={settings.silverJig}
              onChange={(e) =>
                updateSetting("silverJig", parseFloat(e.target.value) || 0)
              }
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Gold JIG $
            </label>
            <input
              type="number"
              value={settings.goldJig}
              onChange={(e) =>
                updateSetting("goldJig", parseFloat(e.target.value) || 0)
              }
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Min JIG Rate Silver $
            </label>
            <input
              type="number"
              value={settings.silverMinCharge}
              onChange={(e) =>
                updateSetting(
                  "silverMinCharge",
                  parseFloat(e.target.value) || 0,
                )
              }
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Min JIG Rate Gold $
            </label>
            <input
              type="number"
              value={settings.goldMinCharge}
              onChange={(e) =>
                updateSetting("goldMinCharge", parseFloat(e.target.value) || 0)
              }
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
            />
          </div>
        </div>

        <div className="mb-3">
          <div className="border-t pt-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">Invoice Settings</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  String Rate $
                </label>
                <input
                  type="number"
                  value={settings.stringRate}
                  onChange={(e) =>
                    updateSetting("stringRate", parseFloat(e.target.value) || 0)
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  Due Days
                </label>
                <input
                  type="number"
                  value={settings.dueDays}
                  onChange={(e) =>
                    updateSetting("dueDays", parseInt(e.target.value) || 0)
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  Next Invoice Number
                </label>
                <input
                  type="number"
                  value={settings.invSeqStart}
                  onChange={(e) =>
                    updateSetting("invSeqStart", parseInt(e.target.value) || 1)
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">JIG Configuration</h3>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">
            Number of JIGs
          </label>
          <input
            type="number"
            value={settings.jigCount}
            onChange={(e) =>
              updateSetting(
                "jigCount",
                Math.min(20, Math.max(1, parseInt(e.target.value) || 6)),
              )
            }
            min="1"
            max="20"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-base"
          />
          <p className="text-xs text-gray-500 mt-1">Between 1 and 20 JIGs</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full bg-primary text-white rounded-xl py-3 text-base font-semibold disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );

  const signOutButton = (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] w-full md:max-w-[430px] left-1/2 -translate-x-1/2 z-40 bg-white px-3 pt-3">
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="w-full border border-red-300 text-red-600 rounded-xl py-3 text-base font-semibold disabled:opacity-50"
      >
        {isSigningOut ? "Signing out..." : "Sign Out"}
      </button>
    </div>
  );

  if (!props.isAdmin) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-4">Settings</h2>
        <div className="pb-20">
          {settingsForm}
          <AddPasskeyButton />
        </div>
        {signOutButton}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Settings</h2>
      <Tabs defaultValue="settings">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <div className="pb-20">
          <TabsContent value="settings">
            {settingsForm}
            <AddPasskeyButton />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab staff={props.staff} pendingInvitations={props.pendingInvitations} />
          </TabsContent>
        </div>
      </Tabs>
      {signOutButton}
    </div>
  );
}
