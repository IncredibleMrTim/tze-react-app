"use client";
import { useIntakeStore } from "@/hooks/useIntakeStore";
import { Switch } from "@/components/ui/switch";

/**
 * Job flag toggles for the Enter Job sheet: urgent, internal, freight,
 * minimum charge and follow-up flag.
 */
export function JobFlagToggles() {
  const {
    urgent,
    isInternal,
    flagged,
    freightRequested,
    minCharge,
    setUrgent,
    setIsInternal,
    setFlagged,
    setFreightRequested,
    setMinCharge,
  } = useIntakeStore();

  return (
    <div className="space-y-3 mb-5">
      <div className="border-2 border-red-300 rounded-lg p-3 bg-red-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-red-700">🚨 Urgent</div>
            <div className="text-xs text-red-600">
              Highlighted red — jumps the queue
            </div>
          </div>
          <Switch
            checked={urgent}
            onCheckedChange={setUrgent}
            className="ml-3"
            aria-label="Toggle urgent"
          />
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              🏭 Internal TGAEP
            </div>
            <div className="text-xs text-gray-500">
              Internal job — no invoice at dispatch
            </div>
          </div>
          <Switch
            checked={isInternal}
            onCheckedChange={setIsInternal}
            className="ml-3"
            aria-label="Toggle internal TGAEP"
          />
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              Freight requested
            </div>
            <div className="text-xs text-gray-500">
              Customer requested freight — cost added at dispatch
            </div>
          </div>
          <Switch
            checked={freightRequested}
            onCheckedChange={setFreightRequested}
            className="ml-3"
            aria-label="Toggle freight requested"
          />
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              Minimum charge
            </div>
            <div className="text-xs text-gray-500">
              Apply $60.00 minimum (Silver)
            </div>
          </div>
          <Switch
            checked={minCharge}
            onCheckedChange={setMinCharge}
            className="ml-3"
            aria-label="Toggle minimum charge"
          />
        </div>
      </div>

      <div className="border-2 border-orange-300 rounded-lg p-3 bg-orange-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-orange-700">
              🔧 Flag this job
            </div>
            <div className="text-xs text-orange-600">
              Mark for follow-up — price correction, missing Xero item, etc
            </div>
          </div>
          <Switch
            checked={flagged}
            onCheckedChange={setFlagged}
            className="ml-3"
            aria-label="Toggle flag job"
          />
        </div>
      </div>
    </div>
  );
}
