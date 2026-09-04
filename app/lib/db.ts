import { prisma } from "./prisma"
import type { Job, JigAssignment, Jig, Prisma } from "@prisma/client"
import type { IJob, IJigAssignment, IJig, IJigAtRisk, ISettings, IStaffMember, IPendingInvitation } from "@/types/interfaces"
import { notify } from "./notify"
import { generateJigsList } from "@/constants/settings.const"

// ============ BIGINT CONVERSION HELPERS ============

type JobWithRelations = Job & {
  jigAssignments?: JigAssignmentWithRelations[]
}
type JigAssignmentWithRelations = JigAssignment & {
  job?: Pick<Job, "po_number" | "customer_name" | "plating" | "poComplete">
  jig?: Jig
}

// The minimal job fields JigClient renders for "jobs on this jig" — used
// on every query/mutation that returns a JigAssignment (including the
// jig_updates WS broadcast) so assignment.job is always populated,
// regardless of which client triggered the change.
const assignmentJobSelect = {
  po_number: true,
  customer_name: true,
  plating: true,
  poComplete: true,
} satisfies Prisma.JobSelect

// Convert BigInt fields to Number for JSON serialization
function serializeJob(job: JobWithRelations): IJob {
  return {
    ...job,
    createdAt: Number(job.createdAt),
    dispatchedAt: job.dispatchedAt ? Number(job.dispatchedAt) : null,
    jigAssignments:
      job.jigAssignments?.map(serializeJigAssignment) || undefined,
  } as unknown as IJob
}

function serializeJigAssignment(
  assignment: JigAssignmentWithRelations,
): IJigAssignment {
  return {
    ...assignment,
    jigName: assignment.jig?.name,
    completedAt: assignment.completedAt ? Number(assignment.completedAt) : null,
    loadedAt: Number(assignment.loadedAt),
    job: assignment.job,
  } as unknown as IJigAssignment
}

// ============ JOBS ============

export async function createJob(job: IJob) {
  const created = await prisma.job.create({
    data: {
      id: job.id,
      po_number: job.po_number,
      customer_name: job.customer_name,
      customer_account: job.customer_account,
      customer_email: job.customer_email,
      customer_contact: job.customer_contact,
      parts: job.parts as any,
      plating: job.plating,
      weightKg: job.weightKg,
      stringCount: job.stringCount,
      stringsRequired: job.stringsRequired,
      requiresWeighing: job.requiresWeighing,
      freightRequested: job.freightRequested,
      minCharge: job.minCharge,
      flagged: job.flagged,
      notes: job.notes,
      poPages: job.poPages,
      partsOnArrivalPhotos: job.partsOnArrivalPhotos,
      manualPO: job.manualPO,
      urgent: job.urgent,
      isInternal: job.isInternal,
      isRework: job.isRework,
      partDescription: job.partDescription,
      createdAt: BigInt(job.createdAt),
      priceOverride: job.priceOverride,
      priceOverrideValue: job.priceOverrideValue,
      freightCost: job.freightCost,
      dispatchedAt: job.dispatchedAt ? BigInt(job.dispatchedAt) : null,
      invoiceNumber: job.invoiceNumber,
      poComplete: job.poComplete,
      fpnDownloaded: job.fpnDownloaded,
      fpnHidden: job.fpnHidden,
      csvDownloaded: job.csvDownloaded,
    },
  })

  const serialized = serializeJob(created)
  notify("job_updates", { type: "created", job: serialized })

  return serialized
}

export async function updateJob(jobId: string, job: Partial<IJob>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { ...job }

  // Convert timestamp fields to BigInt if present
  if (job.createdAt !== undefined) updateData.createdAt = BigInt(job.createdAt)
  if (job.dispatchedAt !== undefined) {
    updateData.dispatchedAt = job.dispatchedAt ? BigInt(job.dispatchedAt) : null
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: updateData,
  })

  const serialized = serializeJob(updated)
  notify("job_updates", { type: "updated", job: serialized })

  return serialized
}

export async function deleteJob(jobId: string) {
  await prisma.job.delete({
    where: { id: jobId },
  })

  notify("job_updates", { type: "deleted", jobId })
}

const jobSelect = {
  id: true,
  po_number: true,
  customer_name: true,
  customer_account: true,
  customer_email: true,
  customer_contact: true,
  parts: true,
  plating: true,
  weightKg: true,
  stringCount: true,
  stringsRequired: true,
  requiresWeighing: true,
  freightRequested: true,
  minCharge: true,
  flagged: true,
  notes: true,
  poPages: true,
  partsOnArrivalPhotos: true,
  manualPO: true,
  urgent: true,
  isInternal: true,
  isRework: true,
  partDescription: true,
  createdAt: true,
  priceOverride: true,
  priceOverrideValue: true,
  freightCost: true,
  dispatchedAt: true,
  invoiceNumber: true,
  poComplete: true,
  fpnDownloaded: true,
  fpnHidden: true,
  csvDownloaded: true,
  updatedAt: true,
  jigAssignments: true,
} satisfies Prisma.JobSelect

// Only what the collapsed intake job card (and the traffic-light/stage
// helpers it calls) actually renders — the on-floor list can be long and
// re-fetched often via infinite scroll, so it skips parts, PO/arrival
// photos, notes, and contact details entirely. Those are fetched lazily
// via getJobById() (useJobById on the client) once a card is opened.
const onFloorCardSelect = {
  id: true,
  po_number: true,
  customer_name: true,
  plating: true,
  urgent: true,
  flagged: true,
  isInternal: true,
  freightRequested: true,
  minCharge: true,
  stringsRequired: true,
  requiresWeighing: true,
  priceOverride: true,
  partDescription: true,
  createdAt: true,
  dispatchedAt: true,
  poComplete: true,
} satisfies Prisma.JobSelect

export async function getJobs() {
  const jobs = await prisma.job.findMany({
    select: jobSelect,
    orderBy: {
      createdAt: "desc",
    },
  })

  return jobs.map((job) => serializeJob(job as unknown as JobWithRelations))
}

// Jobs still assignable to a jig — not dispatched, and not yet marked PO
// complete. Used by the jig page's "add job to jig" selector instead of
// fetching every job and filtering client-side.
export async function getAssignableJobs() {
  const jobs = await prisma.job.findMany({
    where: {
      dispatchedAt: null,
      poComplete: false,
    },
    select: jobSelect,
    orderBy: {
      createdAt: "desc",
    },
  })

  return jobs.map((job) => serializeJob(job as unknown as JobWithRelations))
}

// Paginated, status-filtered version of getJobs() for the intake page's
// primary list — only jobs still "on the shop floor". The where clause is
// the SQL equivalent of isOnFloor() in @/lib/helpers (not dispatched, and
// not [poComplete && has an assignment && every assignment CLEARED]) —
// keep the two in sync if that logic ever changes. Dispatched/older jobs
// remain reachable via the unbounded getJobs()-backed search instead.
export async function getOnFloorJobs(
  params: { cursor?: string; take?: number } = {},
) {
  const { cursor, take = 10 } = params

  const onFloorWhere: Prisma.JobWhereInput = {
    dispatchedAt: null,
    OR: [
      { poComplete: false },
      { jigAssignments: { none: {} } },
      { jigAssignments: { some: { status: { not: "CLEARED" } } } },
    ],
  }

  const [jobs, totalCount] = await Promise.all([
    prisma.job.findMany({
      where: onFloorWhere,
      select: onFloorCardSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.job.count({ where: onFloorWhere }),
  ])

  const hasMore = jobs.length > take
  const page = hasMore ? jobs.slice(0, take) : jobs
  const nextCursor = hasMore ? page[page.length - 1].id : null

  return {
    jobs: page.map((job) => serializeJob(job as unknown as JobWithRelations)),
    nextCursor,
    totalCount,
  }
}

// Paginated, status-filtered version of getJobs() for the dispatch page's
// "Ready to Dispatch" list. The where clause is the SQL equivalent of
// isReady() in @/lib/helpers — keep the two in sync if that logic ever
// changes. Reuses onFloorCardSelect since JobCard needs the same fields
// here as it does on the intake list.
export async function getReadyToDispatchJobs(
  params: { cursor?: string; take?: number; search?: string } = {},
) {
  const { cursor, take = 10, search } = params

  const readyWhere: Prisma.JobWhereInput = {
    dispatchedAt: null,
    poComplete: true,
    jigAssignments: { some: {} },
    NOT: { jigAssignments: { some: { status: { not: "CLEARED" } } } },
  }

  const where: Prisma.JobWhereInput = search?.trim()
    ? {
        AND: [
          readyWhere,
          {
            OR: [
              { po_number: { contains: search, mode: "insensitive" } },
              { customer_name: { contains: search, mode: "insensitive" } },
            ],
          },
        ],
      }
    : readyWhere

  const [jobs, totalCount] = await Promise.all([
    prisma.job.findMany({
      where,
      select: onFloorCardSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.job.count({ where }),
  ])

  const hasMore = jobs.length > take
  const page = hasMore ? jobs.slice(0, take) : jobs
  const nextCursor = hasMore ? page[page.length - 1].id : null

  return {
    jobs: page.map((job) => serializeJob(job as unknown as JobWithRelations)),
    nextCursor,
    totalCount,
  }
}

// The minimal fields the dispatch page's "Downloads" list renders — no
// parts/pricing fields, since FPN/CSV generation lazy-fetches the full job
// via getJobById() once a specific download is actually requested.
const dispatchedRowSelect = {
  id: true,
  po_number: true,
  customer_name: true,
  invoiceNumber: true,
  dispatchedAt: true,
  fpnHidden: true,
  fpnDownloaded: true,
  csvDownloaded: true,
} satisfies Prisma.JobSelect

// Paginated, status-filtered version of getJobs() for the dispatch page's
// "Downloads" list — dispatched jobs not hidden from that list.
export async function getDispatchedJobs(
  params: { cursor?: string; take?: number; search?: string } = {},
) {
  const { cursor, take = 10, search } = params

  const dispatchedWhere: Prisma.JobWhereInput = {
    dispatchedAt: { not: null },
    fpnHidden: false,
  }

  const where: Prisma.JobWhereInput = search?.trim()
    ? {
        AND: [
          dispatchedWhere,
          {
            OR: [
              { po_number: { contains: search, mode: "insensitive" } },
              { customer_name: { contains: search, mode: "insensitive" } },
              { invoiceNumber: { contains: search, mode: "insensitive" } },
            ],
          },
        ],
      }
    : dispatchedWhere

  const [jobs, totalCount] = await Promise.all([
    prisma.job.findMany({
      where,
      select: dispatchedRowSelect,
      orderBy: [{ dispatchedAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.job.count({ where }),
  ])

  const hasMore = jobs.length > take
  const page = hasMore ? jobs.slice(0, take) : jobs
  const nextCursor = hasMore ? page[page.length - 1].id : null

  return {
    jobs: page.map((job) => ({
      ...job,
      dispatchedAt: Number(job.dispatchedAt),
    })),
    nextCursor,
    totalCount,
  }
}

export async function getJobById(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      jigAssignments: true,
    },
  })

  if (!job) return null

  return serializeJob(job)
}

// ============ JIG ASSIGNMENTS ============

export async function createJigAssignment(assignment: IJigAssignment) {
  const created = await prisma.jigAssignment.create({
    data: {
      id: assignment.id,
      jobId: assignment.jobId,
      jigId: assignment.jigId,
      pct: assignment.pct,
      pic: assignment.pic,
      photoId: assignment.photoId,
      completedAt: assignment.completedAt
        ? BigInt(assignment.completedAt)
        : null,
      loadedAt: BigInt(assignment.loadedAt),
      status: assignment.status,
    },
    // job included so assignment.job is populated for every client
    // receiving this over the jig_updates WS broadcast, not just the
    // one that made the request.
    include: { job: { select: assignmentJobSelect }, jig: true },
  })

  const serialized = serializeJigAssignment(created)
  notify("jig_updates", { type: "created", assignment: serialized })

  return serialized
}

export async function updateJigAssignment(
  assignmentId: string,
  assignment: Partial<IJigAssignment>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { ...assignment }
  // jigName/job are derived display fields, not real columns
  delete updateData.jigName
  delete updateData.job

  if (assignment.completedAt !== undefined) {
    updateData.completedAt = assignment.completedAt
      ? BigInt(assignment.completedAt)
      : null
  }
  if (assignment.loadedAt !== undefined) {
    updateData.loadedAt = BigInt(assignment.loadedAt)
  }

  const updated = await prisma.jigAssignment.update({
    where: { id: assignmentId },
    data: updateData,
    include: { job: { select: assignmentJobSelect }, jig: true },
  })

  const serialized = serializeJigAssignment(updated)
  notify("jig_updates", { type: "updated", assignment: serialized })

  return serialized
}

export async function deleteJigAssignment(assignmentId: string) {
  const deleted = await prisma.jigAssignment.delete({
    where: { id: assignmentId },
  })

  notify("jig_updates", { type: "deleted", assignmentId })

  return deleted
}

export async function getJigAssignments() {
  const assignments = await prisma.jigAssignment.findMany({
    include: {
      // Only the fields JigClient renders for "jobs on this jig" — avoids
      // pulling the full job row (parts, photos, etc.) per assignment.
      // Only the fields JigClient renders for "jobs on this jig" — avoids
      // pulling the full job row (parts, photos, etc.) per assignment.
      job: { select: assignmentJobSelect },
      jig: true,
    },
  })

  return assignments.map(serializeJigAssignment)
}

export async function getActiveJigAssignments(jobId: string) {
  const assignments = await prisma.jigAssignment.findMany({
    where: {
      jobId,
      status: "ACTIVE",
    },
    include: { jig: true },
  })

  return assignments.map(serializeJigAssignment)
}

export async function getActiveJigAssignmentsByJig(jigId: string) {
  const assignments = await prisma.jigAssignment.findMany({
    where: {
      jigId,
      status: "ACTIVE",
    },
    include: { jig: true },
  })

  return assignments.map(serializeJigAssignment)
}

export async function getJobWithJigs(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      jigAssignments: {
        where: {
          status: "ACTIVE",
        },
        include: { jig: true },
      },
    },
  })

  if (!job) return null

  return serializeJob(job)
}

// Simple helpers to check jig status
export async function isJobOnJig(jobId: string): Promise<boolean> {
  const count = await prisma.jigAssignment.count({
    where: {
      jobId,
      status: "ACTIVE",
    },
  })

  return count > 0
}

export async function getJobJigName(jobId: string): Promise<string | null> {
  const assignment = await prisma.jigAssignment.findFirst({
    where: {
      jobId,
      status: "ACTIVE",
    },
    select: {
      jig: { select: { name: true } },
    },
  })

  return assignment?.jig.name || null
}

export async function getJobJigNames(jobId: string): Promise<string[]> {
  const assignments = await prisma.jigAssignment.findMany({
    where: {
      jobId,
      status: "ACTIVE",
    },
    select: {
      jig: { select: { name: true } },
    },
  })

  return assignments.map((a) => a.jig.name)
}

// ============ ITEMS ============

export async function getItems() {
  return await prisma.item.findMany({
    orderBy: {
      code: "asc",
    },
  })
}

/**
 * Get items for a specific customer
 * Returns items where customer matches OR customer is empty (generic items)
 */
export async function getItemsByCustomer(customerAccount: string) {
  return await prisma.item.findMany({
    where: {
      OR: [
        { customer: customerAccount },
        { customer: "" },
        { code: { equals: "ZINC MISCELLANEOUS", mode: "insensitive" } },
      ],
    },
    orderBy: {
      code: "asc",
    },
  })
}

export async function searchItems(query: string) {
  return await prisma.item.findMany({
    where: {
      OR: [
        { code: { contains: query, mode: "insensitive" } },
        { desc: { contains: query, mode: "insensitive" } },
        { customer: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: {
      code: "asc",
    },
  })
}

// ============ CONTACTS ============

export async function getContacts() {
  return await prisma.contact.findMany({
    orderBy: {
      name: "asc",
    },
  })
}

export async function getContactByAccount(account: string) {
  return await prisma.contact.findUnique({
    where: { account },
  })
}

export async function searchContacts(query: string) {
  return await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { account: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: {
      name: "asc",
    },
  })
}

// ============ SETTINGS ============

export async function getSettings() {
  let settings = await prisma.settings.findUnique({
    where: { id: 1 },
  })

  if (!settings) {
    // Create default settings if not exists
    settings = await prisma.settings.create({
      data: {
        id: 1,
        silverKg: 300,
        goldKg: 400,
        silverJig: 1,
        goldJig: 1,
        dueDays: 3,
        jigCount: 15,
        invSeqStart: 1,
        stringRate: 1.5,
        invSeq: 1,
      },
    })
  }

  return settings
}

export async function updateSettings(settings: Partial<ISettings>) {
  return await prisma.settings.update({
    where: { id: 1 },
    data: settings,
  })
}

// ============ JIGS ============

export async function getJigs(): Promise<IJig[]> {
  return await prisma.jig.findMany({ orderBy: { name: "asc" } })
}

export async function getOrCreateJigByName(name: string): Promise<IJig> {
  return await prisma.jig.upsert({
    where: { name },
    update: {},
    create: { name },
  })
}

// Jigs are fixed numbered slots ("JIG-01".."JIG-0{count}") — ensure a real
// row exists for each one the current settings expect, creating any that
// are missing. Jigs beyond `count` are never deleted (their JigAssignment
// history — pricing, jig photos — must survive a later reduction), just
// filtered out of what's returned, so they simply stop appearing until
// jigCount grows back to include them again.
export async function ensureJigsExist(count: number): Promise<IJig[]> {
  const names = generateJigsList(count)
  await Promise.all(names.map((name) => getOrCreateJigByName(name)))

  const nameSet = new Set(names)
  const allJigs = await getJigs()
  return allJigs.filter((jig) => nameSet.has(jig.name))
}

// Jigs that would disappear from the JIG page if jigCount were reduced to
// `newCount`, filtered to just the ones that still have a job actively
// loaded — used by the settings page to confirm before sending those jobs
// back to intake.
export async function getJigsAtRiskOfReduction(
  newCount: number,
): Promise<IJigAtRisk[]> {
  const keepNames = new Set(generateJigsList(newCount))
  const allJigs = await getJigs()
  const excessJigs = allJigs.filter((jig) => !keepNames.has(jig.name))
  if (excessJigs.length === 0) return []

  const excessJigIds = excessJigs.map((jig) => jig.id)
  const activeAssignments = await prisma.jigAssignment.findMany({
    where: { jigId: { in: excessJigIds }, status: "ACTIVE" },
    select: { jigId: true, jobId: true, job: { select: assignmentJobSelect } },
  })

  const jobsByJigId = new Map<string, IJigAtRisk["jobs"]>()
  for (const assignment of activeAssignments) {
    const jobs = jobsByJigId.get(assignment.jigId) ?? []
    jobs.push({
      id: assignment.jobId,
      po_number: assignment.job.po_number,
      customer_name: assignment.job.customer_name,
    })
    jobsByJigId.set(assignment.jigId, jobs)
  }

  return excessJigs
    .filter((jig) => jobsByJigId.has(jig.id))
    .map((jig) => ({ jigName: jig.name, jobs: jobsByJigId.get(jig.id)! }))
}

// Sends any job still actively loaded on a jig that's about to disappear
// (jigCount shrinking past it) back to intake: clears its assignment on
// that jig — same as the JIG page's "Remove from JIG" (a correction, not a
// completion, so no history is preserved for it) — and marks the job
// assignable again. Must run before the new jigCount is persisted, so the
// jig never briefly disappears from the JIG page while still holding an
// active job.
export async function removeExcessJigAssignments(
  newCount: number,
): Promise<void> {
  const keepNames = new Set(generateJigsList(newCount))
  const allJigs = await getJigs()
  const excessJigIds = allJigs
    .filter((jig) => !keepNames.has(jig.name))
    .map((jig) => jig.id)
  if (excessJigIds.length === 0) return

  const activeAssignments = await prisma.jigAssignment.findMany({
    where: { jigId: { in: excessJigIds }, status: "ACTIVE" },
  })
  if (activeAssignments.length === 0) return

  const affectedJobIds = new Set(activeAssignments.map((a) => a.jobId))

  await Promise.all(
    activeAssignments.map((assignment) => deleteJigAssignment(assignment.id)),
  )
  await Promise.all(
    Array.from(affectedJobIds).map((jobId) =>
      updateJob(jobId, { poComplete: false }),
    ),
  )
  await Promise.all(excessJigIds.map((jigId) => clearJigStateIfEmpty(jigId)))
}

// A jig's rework flag is "live" state for whatever is currently loaded on
// that physical slot. This only runs for a job leaving a jig WITHOUT
// completing it (e.g. removed by mistake) — the assignment row is deleted
// outright with no photoId to preserve, so the live photo genuinely has
// nothing left needing it and can be disassociated (not deleted) along
// with the rework flag. Completing a jig normally (completeJigAction)
// does NOT go through here — it keeps the photo row as permanent history
// via photoId instead.
export async function clearJigStateIfEmpty(jigId: string) {
  const stillActive = await prisma.jigAssignment.count({
    where: { jigId, status: "ACTIVE" },
  })
  if (stillActive === 0) {
    await clearCurrentJigPhoto(jigId)
    await deleteJigRework(jigId)
  }
}

// ============ JIG PHOTOS ============
// Append-only: one row per load cycle, never deleted. Jig.currentPhotoId
// is the single source of truth for "the live photo for this jig right
// now" — set whenever a photo is uploaded, and explicitly cleared (not
// inferred) whenever the jig completes or empties out. Older rows stick
// around as permanent history for whichever JigAssignments reference them
// via photoId, entirely independent of currentPhotoId.

export async function getJigPhoto(jigId: string) {
  const jig = await prisma.jig.findUnique({
    where: { id: jigId },
    include: { currentPhoto: true },
  })
  return jig?.currentPhoto ?? null
}

export async function setJigPhoto(jigId: string, photoData: string) {
  const photo = await prisma.jigPhoto.create({
    data: { jigId, photoData },
  })
  await prisma.jig.update({
    where: { id: jigId },
    data: { currentPhotoId: photo.id },
  })
  notify("jig_updates", {
    type: "photo-updated",
    jigId,
    photoUrl: photo.photoData,
  })
  return photo
}

export async function getAllJigPhotos() {
  const jigs = await prisma.jig.findMany({
    where: { currentPhotoId: { not: null } },
    include: { currentPhoto: true },
  })
  return jigs.reduce((acc: Record<string, string>, jig) => {
    if (jig.currentPhoto) acc[jig.id] = jig.currentPhoto.photoData
    return acc
  }, {})
}

export async function getJigPhotosByIds(photoIds: string[]) {
  return await prisma.jigPhoto.findMany({
    where: { id: { in: photoIds } },
  })
}

// Disassociates a jig's current photo without deleting the row — it may
// still be permanent history for a cleared JigAssignment's photoId.
export async function clearCurrentJigPhoto(jigId: string) {
  const jig = await prisma.jig.update({
    where: { id: jigId },
    data: { currentPhotoId: null },
  })
  notify("jig_updates", { type: "photo-cleared", jigId })
  return jig
}

// ============ JIG REWORK ============

export async function setJigRework(jigId: string, isRework: boolean) {
  const rework = await prisma.jigRework.upsert({
    where: { jigId },
    update: { isRework },
    create: { jigId, isRework },
  })
  notify("jig_updates", { type: "rework-updated", jigId, isRework })
  return rework
}

export async function deleteJigRework(jigId: string) {
  const result = await prisma.jigRework.deleteMany({
    where: { jigId },
  })
  notify("jig_updates", { type: "rework-cleared", jigId })
  return result
}

export async function getAllJigRework() {
  const rows = await prisma.jigRework.findMany()
  return rows.reduce(
    (
      acc: Record<string, boolean>,
      row: { jigId: string; isRework: boolean },
    ) => {
      acc[row.jigId] = row.isRework
      return acc
    },
    {} as Record<string, boolean>,
  )
}

// ============ PO RULES ============

export async function getAllPoRules() {
  return await prisma.poRule.findMany({
    orderBy: {
      priority: "asc",
    },
  })
}

export async function getPoRulesByAccount(contactAccount: string) {
  return await prisma.poRule.findMany({
    where: { contactAccount },
    orderBy: {
      priority: "asc",
    },
  })
}

// ============ AUTH ============

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({ where: { email } })
}

export async function createUser(email: string, role: string) {
  return await prisma.user.create({ data: { email, role } })
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } })
}

export async function getStaff(): Promise<IStaffMember[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } })
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as IStaffMember["role"],
  }))
}

export async function getPendingInvitations(): Promise<IPendingInvitation[]> {
  const invitations = await prisma.invitation.findMany({
    where: { acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
  })
  return invitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role as IPendingInvitation["role"],
    expiresAt: invitation.expiresAt.getTime(),
  }))
}

export async function createInvitation(email: string, role: string, token: string, expiresAt: Date) {
  return await prisma.invitation.create({ data: { email, role, token, expiresAt } })
}

export async function getInvitationByToken(token: string) {
  return await prisma.invitation.findUnique({ where: { token } })
}

export async function markInvitationAccepted(id: string) {
  await prisma.invitation.update({ where: { id }, data: { acceptedAt: new Date() } })
}

export async function revokeInvitation(id: string) {
  await prisma.invitation.delete({ where: { id } })
}

export async function createCredential(data: {
  userId: string
  credentialId: string
  publicKey: Uint8Array
  counter: number
  transports: string[]
  deviceType: string
  backedUp: boolean
}) {
  return await prisma.credential.create({
    data: {
      ...data,
      publicKey: Buffer.from(data.publicKey),
      counter: BigInt(data.counter),
    },
  })
}

export async function getCredentialByCredentialId(credentialId: string) {
  return await prisma.credential.findUnique({
    where: { credentialId },
    include: { user: true },
  })
}

export async function getCredentialsByUserId(userId: string) {
  return await prisma.credential.findMany({ where: { userId } })
}

export async function updateCredentialCounter(credentialId: string, counter: number) {
  await prisma.credential.update({
    where: { credentialId },
    data: { counter: BigInt(counter) },
  })
}
