import { useMemo } from "react"
import type { IJob, IJigAssignment, ISettings } from "@/types/interfaces"
import { calcPrice, jigsOf } from "@/lib/helpers"
import { calculateRates } from "@/constants/settings.const"

export interface IPricingBreakdown {
  rate: { kg: number; jig: number }
  weightCost: number
  jigLabel: string
  jigCost: number
  stringCost: number
  invoiceTotal: number
}

/**
 * Derives the per-line pricing figures shown in the dispatch modal (weight,
 * jig space, strings, invoice total) from a job's raw fields — kept separate
 * from calcPrice()'s invoice-total logic, which picks the highest of these
 * rather than summing them.
 */
export function usePricingBreakdown(
  job: IJob | undefined,
  settings: ISettings | undefined,
  jigAssignments: IJigAssignment[],
): IPricingBreakdown | null {
  return useMemo(() => {
    if (!job || !settings) return null

    const rate = calculateRates(settings)[job.plating]
    const jigPcts = jigsOf(job.id, jigAssignments)
    const jigPctSum = jigPcts.reduce((sum, j) => sum + j.pct, 0)

    return {
      rate,
      weightCost: (job.weightKg || 0) * rate.kg,
      jigLabel: jigPcts.map((j) => `${j.pct}%`).join(" + "),
      jigCost: (jigPctSum / 100) * rate.jig,
      stringCost: (job.stringCount || 0) * (settings.stringRate || 25),
      invoiceTotal: calcPrice(job, settings, jigAssignments),
    }
  }, [job, settings, jigAssignments])
}
