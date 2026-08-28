import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/useToast"
import { useJobById, useCreateJob, useUpdateJob } from "@/hooks/useJobs"
import { useIntakeStore } from "@/store/useIntakeStore"
import { parseClampedNumber } from "@/lib/helpers"
import type { IJob } from "@/types/interfaces"

/**
 * Validation and persistence logic for the Enter Job sheet.
 *
 * Validates the intake form, then creates or updates the job (depending on
 * whether the sheet was opened for editing) via React Query mutations with
 * optimistic updates.
 *
 * @returns handleSave callback and pending state for the save button
 */
export function useSaveJob() {
  const { showToast } = useToast()
  const router = useRouter()
  const createJobMutation = useCreateJob()
  const updateJobMutation = useUpdateJob()

  const {
    editingJobId,
    returnToDispatch,
    closeSheet,
    customer,
    po_number,
    contactNumber,
    partsDescription,
    parts,
    plating,
    notes,
    urgent,
    isInternal,
    flagged,
    stringsRequired,
    stringCount,
    requiresWeighing,
    freightRequested,
    minCharge,
    poPages,
    partsOnArrivalPhotos,
    weightKg,
    freightCost,
    priceOverride,
    priceOverrideValue,
  } = useIntakeStore()
  const { data: existingJob } = useJobById(editingJobId)

  const handleSave = () => {
    if (!customer && !isInternal) {
      showToast("Please select a customer")
      return
    }

    if (!po_number.trim()) {
      showToast("Please enter a PO number")
      return
    }

    const parsedFreightCost = parseClampedNumber(freightCost, { min: 0 }) ?? 0
    const parsedPriceOverrideValue =
      parseClampedNumber(priceOverrideValue, { min: 0 }) ?? 0

    if (editingJobId) {
      if (!existingJob) return

      const updatedJob: Partial<IJob> = {
        po_number,
        customer_name: customer?.name || "Internal",
        customer_account: customer?.account || "",
        customer_email: customer?.email || "",
        customer_contact: contactNumber,
        parts,
        plating,
        stringCount,
        weightKg,
        stringsRequired,
        requiresWeighing,
        freightRequested,
        minCharge,
        flagged,
        notes,
        poPages,
        partsOnArrivalPhotos,
        urgent,
        isInternal,
        partDescription: partsDescription,
        freightCost: parsedFreightCost,
        priceOverride,
        priceOverrideValue: parsedPriceOverrideValue,
      }

      // Use React Query mutation with optimistic updates
      updateJobMutation.mutate(
        { jobId: editingJobId, job: updatedJob },
        {
          onSuccess: () => {
            closeSheet()
            showToast("Job updated: " + po_number)
            if (returnToDispatch) router.push("/dispatch")
          },
          onError: (error: Error) => {
            console.error("Update job error:", error)
            const message = error?.message || "Unknown error"
            showToast(`Failed to update job: ${message}`)
          },
        },
      )
    } else {
      const now = Date.now()
      // Generate unique ID with random suffix to prevent collisions
      const randomSuffix = Math.random().toString(36).substring(2, 9)
      const jobId = `${now}-${randomSuffix}`

      const job: IJob = {
        id: jobId,
        po_number,
        customer_name: customer?.name || "Internal",
        customer_account: customer?.account || "",
        customer_email: customer?.email || "",
        customer_contact: contactNumber,
        parts,
        plating,
        weightKg,
        stringCount,
        stringsRequired,
        requiresWeighing,
        freightRequested,
        minCharge,
        flagged,
        notes,
        poPages,
        partsOnArrivalPhotos,
        manualPO: false,
        urgent,
        isInternal,
        isRework: false,
        partDescription: partsDescription,
        createdAt: now,
        priceOverride,
        priceOverrideValue: parsedPriceOverrideValue,
        freightCost: parsedFreightCost,
        dispatchedAt: null,
        invoiceNumber: null,
        poComplete: false,
        fpnDownloaded: false,
        fpnHidden: false,
        csvDownloaded: false,
      }

      // Use React Query mutation with optimistic updates
      createJobMutation.mutate(job, {
        onSuccess: () => {
          closeSheet()
          showToast("Job created: " + po_number)
        },
        onError: (error: Error) => {
          console.error("Create job error:", error)
          const message = error?.message || "Unknown error"
          showToast(
            message === "PO number already exists"
              ? message
              : `Failed to create job: ${message}`,
          )
        },
      })
    }
  }

  return {
    handleSave,
    isSaving: createJobMutation.isPending || updateJobMutation.isPending,
  }
}
