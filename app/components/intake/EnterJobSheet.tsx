"use client";
import { useIntakeStore } from "@/store/useIntakeStore";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { POScanSection } from "@/components/intake/POScanSection";
import { CustomerField } from "@/components/intake/CustomerField";
import { PartsSection } from "@/components/intake/PartsSection";
import { PartsPhotosSection } from "@/components/intake/PartsPhotosSection";
import { JobFlagToggles } from "@/components/intake/JobFlagToggles";

import { useSaveJob } from "@/components/intake/useSaveJob";

/**
 * Enter Job sheet — the intake form for creating or editing a job.
 *
 * Renders as an overlay when the intake store's showSheet flag is set. All
 * form state lives in the intake store so the sheet can be pre-populated
 * (e.g. when editing an existing job or applying a PO scan result).
 */
export function EnterJobSheet() {
  const {
    showSheet,
    closeSheet,
    customer,
    po_number,
    contactNumber,
    partsDescription,
    plating,
    notes,
    isInternal,
    stringsRequired,
    requiresWeighing,
    stringCount,
    weightKg,
    setPoNumber,
    setContactNumber,
    setPartsDescription,
    setPlating,
    setStringCount,
    setWeightKg,
    setNotes,
    setStringsRequired,
    setRequiresWeighing,
  } = useIntakeStore();
  const { handleSave, isSaving } = useSaveJob();

  if (!showSheet) return null;

  return (
    <Drawer open onOpenChange={(open) => !open && closeSheet()}>
      <DrawerContent className="mx-auto h-[90%] max-w-[430px] rounded-t-[20px] border-none bg-white">
        <div className="px-4 pt-5 flex-1 min-h-0 overflow-y-auto">
          <DrawerTitle className="text-[17px] font-bold mb-4">
            Enter Job
          </DrawerTitle>

          <POScanSection />

          <CustomerField />

          <div className="mb-4">
            <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
              PO number{" "}
              <span className="text-gray-400 font-normal text-xs">
                (leave blank to auto-assign)
              </span>
            </label>
            <Input
              type="text"
              value={po_number}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="Customer PO number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
            />
          </div>

          <div className="mb-4">
            <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
              Contact number{" "}
              <span className="text-gray-400 font-normal text-xs">
                (optional)
              </span>
            </label>
            <Input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="e.g. 021 123 4567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
            />
          </div>

          <div className="mb-5">
            <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
              Parts description{" "}
              <span className="text-gray-400 font-normal text-xs">
                (optional — shows on job card)
              </span>
            </label>
            <Input
              type="text"
              value={partsDescription}
              onChange={(e) => setPartsDescription(e.target.value)}
              placeholder="e.g. roller pins x50, swing arms"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
            />
          </div>

          <div className="mb-5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              PLATING
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => setPlating("silver")}
                className={`flex-1 py-2.5 border rounded-lg text-sm font-medium ${
                  plating === "silver"
                    ? "border-gray-400 bg-gray-400"
                    : "border-gray-300 text-gray-500 bg-white"
                }`}
              >
                Silver (zinc bright)
              </Button>
              <Button
                onClick={() => setPlating("gold")}
                className={`flex-1 py-2.5 border rounded-lg text-sm font-medium ${
                  plating === "gold"
                    ? "border-gray-400 bg-yellow-400 text-gray-900 disabled:bg-yellow-200"
                    : "border text-gray-500 bg-white"
                }`}
              >
                Gold (zinc yellow)
              </Button>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              JIG RATE OPTIONS —{" "}
              <span className="font-normal normal-case text-gray-400">
                fill in if no part prices on PO
              </span>
            </label>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 border p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label
                      className="text-sm font-medium text-gray-900"
                      htmlFor="string-required"
                    >
                      Strings required
                    </label>
                    <div className="text-xs text-gray-500">
                      JIG cannot complete until string count is entered
                    </div>
                  </div>

                  <Switch
                    id="string-required"
                    checked={stringsRequired}
                    onCheckedChange={setStringsRequired}
                    aria-label="Toggle strings required"
                  />
                </div>
                {stringsRequired && (
                  <Input
                    defaultValue={stringCount || 0}
                    onChange={(e) => setStringCount(parseInt(e.target.value))}
                  />
                )}
              </div>

              <div className="flex flex-col gap-2 border p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Requires weighing
                    </div>
                    <div className="text-xs text-gray-500">
                      Dispatch blocked until weight is entered
                    </div>
                  </div>
                  <Switch
                    checked={requiresWeighing}
                    onCheckedChange={setRequiresWeighing}
                    className="ml-3"
                    aria-label="Toggle requires weighing"
                  />
                </div>
                {requiresWeighing && (
                  <Input
                    defaultValue={weightKg || 0}
                    onChange={(e) => setWeightKg(parseInt(e.target.value))}
                  />
                )}
              </div>
            </div>
          </div>

          <PartsSection />

          <PartsPhotosSection />

          <div className="mb-5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              COLLECTION INSTRUCTIONS / NOTES
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special handling or collection instructions..."
              rows={3}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          <JobFlagToggles />

          <div className="flex gap-3 pt-4 pb-4 border-t border-gray-200">
            <button
              onClick={closeSheet}
              className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-base font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={(!customer && !isInternal) || isSaving}
              className="flex-1 bg-primary text-white rounded-lg py-3 text-base font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Job"}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
