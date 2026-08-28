"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateSettingsAction } from "@/actions/settings"
import {
  checkJigCountReductionAction,
  resolveJigCountReductionAction,
} from "@/actions/jigs"
import { useToast } from "@/hooks/useToast"
import { settingsFormSchema } from "@/lib/settings-form-schema"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type {
  IJigAtRisk,
  IPendingInvitation,
  ISettings,
  IStaffMember,
} from "@/types/interfaces"
import AddPasskeyButton from "@/components/settings/AddPasskeyButton"
import { NumberField } from "@/components/settings/NumberField"
import UsersTab from "./UsersTab"
import { Button } from "@/components/ui/button"

type SettingsClientProps =
  | { initialSettings: ISettings; isAdmin: false }
  | {
      initialSettings: ISettings
      isAdmin: true
      staff: IStaffMember[]
      pendingInvitations: IPendingInvitation[]
    }

export default function SettingsClient(props: SettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { showToast } = useToast()
  const [settings, setSettings] = useState(props.initialSettings)

  // Raw text of each numeric input, tracked separately from `settings`.
  // Binding an <input type="number"> directly to the parsed number means
  // clearing the field re-renders it with `parseFloat("") || fallback`
  // before the next keystroke lands — the field snaps back to a number
  // (often the same as the current value) instead of staying empty, so
  // new digits get appended to the stale value instead of replacing it.
  // Keeping the displayed text independent lets the field go blank while
  // typing; it's only reconciled back to the committed number on blur.
  const [inputText, setInputText] = useState(() => ({
    silverKg: String(props.initialSettings.silverKg),
    goldKg: String(props.initialSettings.goldKg),
    silverJig: String(props.initialSettings.silverJig),
    goldJig: String(props.initialSettings.goldJig),
    silverMinCharge: String(props.initialSettings.silverMinCharge),
    goldMinCharge: String(props.initialSettings.goldMinCharge),
    stringRate: String(props.initialSettings.stringRate),
    dueDays: String(props.initialSettings.dueDays),
    invSeqStart: String(props.initialSettings.invSeqStart),
    jigCount: String(props.initialSettings.jigCount),
  }))

  type NumberFieldKey = keyof typeof inputText

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<NumberFieldKey, string>>
  >({})

  // Set when saving would reduce jigCount past a jig that still has a job
  // actively loaded on it — the save is held until the user confirms those
  // jobs should be unassigned and sent back to intake.
  const [jigReductionConfirm, setJigReductionConfirm] = useState<{
    atRiskJigs: IJigAtRisk[]
    nextSettings: ISettings
  } | null>(null)

  const handleNumberChange = (
    key: NumberFieldKey,
    rawValue: string,
    options: { integer?: boolean; min?: number; max?: number } = {},
  ) => {
    setInputText((prev) => ({ ...prev, [key]: rawValue }))
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })

    const parsed = options.integer
      ? parseInt(rawValue, 10)
      : parseFloat(rawValue)
    if (Number.isNaN(parsed)) return

    const clamped = Math.min(
      options.max ?? Infinity,
      Math.max(options.min ?? -Infinity, parsed),
    )
    setSettings((prev) => ({ ...prev, [key]: clamped }))
  }

  // Once the field loses focus, replace whatever partial/invalid text was
  // left behind (e.g. "", "-", a clamped-away value) with the actual
  // committed number, so the display can't drift from what gets saved.
  const handleNumberBlur = (key: NumberFieldKey) => {
    setInputText((prev) => ({ ...prev, [key]: String(settings[key]) }))
  }

  const persistSettings = async (settingsToSave: ISettings) => {
    const result = await updateSettingsAction(settingsToSave)
    if (result.success) {
      showToast("Settings saved")
    } else {
      showToast("Failed to save settings")
    }
  }

  const handleSave = () => {
    // Every settings field is required — reject blanks/invalid numbers
    // here rather than silently falling back to a default, which is what
    // let fields go unset before.
    const validation = settingsFormSchema.safeParse(inputText)
    if (!validation.success) {
      const errors: Partial<Record<NumberFieldKey, string>> = {}
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as NumberFieldKey
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      showToast("Fix the highlighted fields before saving")
      return
    }

    setFieldErrors({})
    const nextSettings: ISettings = { ...settings, ...validation.data }
    setSettings(nextSettings)

    startTransition(async () => {
      // Cheap read on every save — only a reduced jigCount can ever put a
      // jig at risk, and the server is the source of truth for which jigs
      // actually exist and hold active jobs, not just our own edit history.
      const check = await checkJigCountReductionAction(nextSettings.jigCount)
      if (check.success && check.atRiskJigs.length > 0) {
        setJigReductionConfirm({
          atRiskJigs: check.atRiskJigs,
          nextSettings,
        })
        return
      }
      await persistSettings(nextSettings)
    })
  }

  const handleConfirmJigReduction = () => {
    if (!jigReductionConfirm) return
    const { nextSettings } = jigReductionConfirm
    setJigReductionConfirm(null)

    startTransition(async () => {
      await resolveJigCountReductionAction(nextSettings.jigCount)
      await persistSettings(nextSettings)
    })
  }

  const handleCancelJigReduction = () => {
    setJigReductionConfirm(null)
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/sign-in")
    router.refresh()
  }

  const settingsForm = (
    <div>
      <div className="pt-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">Rate Card</h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <NumberField
            label="Silver $/kg"
            value={inputText.silverKg}
            onChange={(value) => handleNumberChange("silverKg", value)}
            onBlur={() => handleNumberBlur("silverKg")}
            error={fieldErrors.silverKg}
            step="0.1"
          />
          <NumberField
            label="Gold $/kg"
            value={inputText.goldKg}
            onChange={(value) => handleNumberChange("goldKg", value)}
            onBlur={() => handleNumberBlur("goldKg")}
            error={fieldErrors.goldKg}
            step="0.1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <NumberField
            label="Silver JIG $"
            value={inputText.silverJig}
            onChange={(value) => handleNumberChange("silverJig", value)}
            onBlur={() => handleNumberBlur("silverJig")}
            error={fieldErrors.silverJig}
          />
          <NumberField
            label="Gold JIG $"
            value={inputText.goldJig}
            onChange={(value) => handleNumberChange("goldJig", value)}
            onBlur={() => handleNumberBlur("goldJig")}
            error={fieldErrors.goldJig}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <NumberField
            label="Min JIG Rate Silver $"
            value={inputText.silverMinCharge}
            onChange={(value) =>
              handleNumberChange("silverMinCharge", value)
            }
            onBlur={() => handleNumberBlur("silverMinCharge")}
            error={fieldErrors.silverMinCharge}
          />
          <NumberField
            label="Min JIG Rate Gold $"
            value={inputText.goldMinCharge}
            onChange={(value) => handleNumberChange("goldMinCharge", value)}
            onBlur={() => handleNumberBlur("goldMinCharge")}
            error={fieldErrors.goldMinCharge}
          />
        </div>

        <div className="mb-3">
          <div className="border-t pt-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">Invoice Settings</h3>
            <div className="flex flex-col gap-4">
              <NumberField
                label="String Rate $"
                value={inputText.stringRate}
                onChange={(value) => handleNumberChange("stringRate", value)}
                onBlur={() => handleNumberBlur("stringRate")}
                error={fieldErrors.stringRate}
              />
              <NumberField
                label="Due Days"
                value={inputText.dueDays}
                onChange={(value) =>
                  handleNumberChange("dueDays", value, { integer: true })
                }
                onBlur={() => handleNumberBlur("dueDays")}
                error={fieldErrors.dueDays}
              />
              <NumberField
                label="Next Invoice Number"
                value={inputText.invSeqStart}
                onChange={(value) =>
                  handleNumberChange("invSeqStart", value, { integer: true })
                }
                onBlur={() => handleNumberBlur("invSeqStart")}
                error={fieldErrors.invSeqStart}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">JIG Configuration</h3>
        <NumberField
          label="Number of JIGs"
          value={inputText.jigCount}
          onChange={(value) =>
            handleNumberChange("jigCount", value, {
              integer: true,
              min: 1,
              max: 20,
            })
          }
          onBlur={() => handleNumberBlur("jigCount")}
          error={fieldErrors.jigCount}
          min="1"
          max="20"
          hint="Between 1 and 20 JIGs"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full bg-primary text-white rounded-xl py-3 text-base font-semibold disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Settings"}
      </button>
    </div>
  )

  const jigReductionDialog = (
    <AlertDialog
      open={!!jigReductionConfirm}
      onOpenChange={(open) => !open && handleCancelJigReduction()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send jobs back to intake?</AlertDialogTitle>
          <AlertDialogDescription>
            Reducing to {jigReductionConfirm?.nextSettings.jigCount} JIGs
            removes {jigReductionConfirm?.atRiskJigs.length} JIG
            {jigReductionConfirm?.atRiskJigs.length === 1 ? "" : "s"} that
            still {jigReductionConfirm?.atRiskJigs.length === 1 ? "has" : "have"}{" "}
            a job loaded. Those jobs will be unassigned from their JIG and
            sent back to intake.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm text-gray-700 space-y-1">
          {jigReductionConfirm?.atRiskJigs.map(({ jigName, jobs }) => (
            <div key={jigName}>
              <span className="font-semibold">{jigName}:</span>{" "}
              {jobs.map((job) => job.po_number).join(", ")}
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelJigReduction}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmJigReduction}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Yes, send back
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  const signOutButton = (
    <div className="flex justify-center w-full">
      <Button
        variant="link"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="text-sm disabled:opacity-50 text-gray-600 underline"
      >
        {isSigningOut ? "Signing out..." : "Sign Out"}
      </Button>
    </div>
  )

  if (!props.isAdmin) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-4">Settings</h2>
        <div>
          {settingsForm}
          <AddPasskeyButton />
        </div>
        {signOutButton}
        {jigReductionDialog}
      </div>
    )
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
            <UsersTab
              staff={props.staff}
              pendingInvitations={props.pendingInvitations}
            />
          </TabsContent>
        </div>
      </Tabs>
      {signOutButton}
      {jigReductionDialog}
    </div>
  )
}
