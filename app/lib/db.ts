import { prisma } from "./prisma";
import type { Job, JigAssignment, Jig } from "@prisma/client";
import type { IJob, IJigAssignment, IJig, ISettings } from "@/types/interfaces";
import { notify } from "./notify";
import { generateJigsList } from "@/constants/settings.const";

// ============ BIGINT CONVERSION HELPERS ============

type JobWithRelations = Job & {
  jigAssignments?: JigAssignmentWithRelations[];
};
type JigAssignmentWithRelations = JigAssignment & { job?: Job; jig?: Jig };

// Convert BigInt fields to Number for JSON serialization
function serializeJob(job: JobWithRelations): IJob {
  return {
    ...job,
    createdAt: Number(job.createdAt),
    dispatchedAt: job.dispatchedAt ? Number(job.dispatchedAt) : null,
    jigAssignments:
      job.jigAssignments?.map(serializeJigAssignment) || undefined,
  } as unknown as IJob;
}

function serializeJigAssignment(
  assignment: JigAssignmentWithRelations,
): IJigAssignment {
  return {
    ...assignment,
    jigName: assignment.jig?.name,
    completedAt: assignment.completedAt ? Number(assignment.completedAt) : null,
    loadedAt: Number(assignment.loadedAt),
    job: assignment.job ? serializeJob(assignment.job) : undefined,
  } as unknown as IJigAssignment;
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
      freightCost: job.freightCost,
      dispatchedAt: job.dispatchedAt ? BigInt(job.dispatchedAt) : null,
      invoiceNumber: job.invoiceNumber,
      poComplete: job.poComplete,
      fpnDownloaded: job.fpnDownloaded,
      fpnHidden: job.fpnHidden,
      csvDownloaded: job.csvDownloaded,
    },
  });

  const serialized = serializeJob(created);
  await notify("job_updates", { type: "created", job: serialized });

  return serialized;
}

export async function updateJob(jobId: string, job: Partial<IJob>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { ...job };

  // Convert timestamp fields to BigInt if present
  if (job.createdAt !== undefined) updateData.createdAt = BigInt(job.createdAt);
  if (job.dispatchedAt !== undefined) {
    updateData.dispatchedAt = job.dispatchedAt
      ? BigInt(job.dispatchedAt)
      : null;
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: updateData,
  });

  const serialized = serializeJob(updated);
  await notify("job_updates", { type: "updated", job: serialized });

  return serialized;
}

export async function deleteJob(jobId: string) {
  await prisma.job.delete({
    where: { id: jobId },
  });

  await notify("job_updates", { type: "deleted", jobId });
}

export async function getJobs() {
  const jobs = await prisma.job.findMany({
    select: {
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
      freightCost: true,
      dispatchedAt: true,
      invoiceNumber: true,
      poComplete: true,
      fpnDownloaded: true,
      fpnHidden: true,
      csvDownloaded: true,
      updatedAt: true,
      jigAssignments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return jobs.map((job) => serializeJob(job as unknown as JobWithRelations));
}

export async function getJobById(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      jigAssignments: true,
    },
  });

  if (!job) return null;

  return serializeJob(job);
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
    include: { jig: true },
  });

  const serialized = serializeJigAssignment(created);
  await notify("jig_updates", { type: "created", assignment: serialized });

  return serialized;
}

export async function updateJigAssignment(
  assignmentId: string,
  assignment: Partial<IJigAssignment>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { ...assignment };
  // jigName/job are derived display fields, not real columns
  delete updateData.jigName;
  delete updateData.job;

  if (assignment.completedAt !== undefined) {
    updateData.completedAt = assignment.completedAt
      ? BigInt(assignment.completedAt)
      : null;
  }
  if (assignment.loadedAt !== undefined) {
    updateData.loadedAt = BigInt(assignment.loadedAt);
  }

  const updated = await prisma.jigAssignment.update({
    where: { id: assignmentId },
    data: updateData,
    include: { jig: true },
  });

  const serialized = serializeJigAssignment(updated);
  await notify("jig_updates", { type: "updated", assignment: serialized });

  return serialized;
}

export async function deleteJigAssignment(assignmentId: string) {
  const deleted = await prisma.jigAssignment.delete({
    where: { id: assignmentId },
  });

  await notify("jig_updates", { type: "deleted", assignmentId });

  return deleted;
}

export async function getJigAssignments() {
  const assignments = await prisma.jigAssignment.findMany({
    include: {
      job: true,
      jig: true,
    },
  });

  return assignments.map(serializeJigAssignment);
}

export async function deleteJigAssignmentsByJobId(jobId: string) {
  const result = await prisma.jigAssignment.deleteMany({
    where: { jobId },
  });

  await notify("jig_updates", { type: "deleted-by-job", jobId });

  return result;
}

export async function getActiveJigAssignments(jobId: string) {
  const assignments = await prisma.jigAssignment.findMany({
    where: {
      jobId,
      status: "ACTIVE",
    },
    include: { jig: true },
  });

  return assignments.map(serializeJigAssignment);
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
  });

  if (!job) return null;

  return serializeJob(job);
}

// Simple helpers to check jig status
export async function isJobOnJig(jobId: string): Promise<boolean> {
  const count = await prisma.jigAssignment.count({
    where: {
      jobId,
      status: "ACTIVE",
    },
  });

  return count > 0;
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
  });

  return assignment?.jig.name || null;
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
  });

  return assignments.map((a) => a.jig.name);
}

// ============ ITEMS ============

export async function getItems() {
  return await prisma.item.findMany({
    orderBy: {
      code: "asc",
    },
  });
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
  });
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
  });
}

// ============ CONTACTS ============

export async function getContacts() {
  return await prisma.contact.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getContactByAccount(account: string) {
  return await prisma.contact.findUnique({
    where: { account },
  });
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
  });
}

// ============ SETTINGS ============

export async function getSettings() {
  let settings = await prisma.settings.findUnique({
    where: { id: 1 },
  });

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
    });
  }

  return settings;
}

export async function updateSettings(settings: Partial<ISettings>) {
  return await prisma.settings.update({
    where: { id: 1 },
    data: settings,
  });
}

// ============ JIGS ============

export async function getJigs(): Promise<IJig[]> {
  return await prisma.jig.findMany({ orderBy: { name: "asc" } });
}

export async function getOrCreateJigByName(name: string): Promise<IJig> {
  return await prisma.jig.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

// Jigs are fixed numbered slots ("JIG-01".."JIG-0{count}") — ensure a real
// row exists for each one the current settings expect, creating any that
// are missing, and return the full list.
export async function ensureJigsExist(count: number): Promise<IJig[]> {
  const names = generateJigsList(count);
  await Promise.all(names.map((name) => getOrCreateJigByName(name)));
  return await getJigs();
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
  });
  if (stillActive === 0) {
    await clearCurrentJigPhoto(jigId);
    await deleteJigRework(jigId);
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
  });
  return jig?.currentPhoto ?? null;
}

export async function setJigPhoto(jigId: string, photoData: string) {
  const photo = await prisma.jigPhoto.create({
    data: { jigId, photoData },
  });
  await prisma.jig.update({
    where: { id: jigId },
    data: { currentPhotoId: photo.id },
  });
  return photo;
}

export async function getAllJigPhotos() {
  const jigs = await prisma.jig.findMany({
    where: { currentPhotoId: { not: null } },
    include: { currentPhoto: true },
  });
  return jigs.reduce((acc: Record<string, string>, jig) => {
    if (jig.currentPhoto) acc[jig.id] = jig.currentPhoto.photoData;
    return acc;
  }, {});
}

export async function getJigPhotosByIds(photoIds: string[]) {
  return await prisma.jigPhoto.findMany({
    where: { id: { in: photoIds } },
  });
}

// Disassociates a jig's current photo without deleting the row — it may
// still be permanent history for a cleared JigAssignment's photoId.
export async function clearCurrentJigPhoto(jigId: string) {
  return await prisma.jig.update({
    where: { id: jigId },
    data: { currentPhotoId: null },
  });
}

// ============ JIG REWORK ============

export async function setJigRework(jigId: string, isRework: boolean) {
  return await prisma.jigRework.upsert({
    where: { jigId },
    update: { isRework },
    create: { jigId, isRework },
  });
}

export async function deleteJigRework(jigId: string) {
  return await prisma.jigRework.deleteMany({
    where: { jigId },
  });
}

export async function getAllJigRework() {
  const rows = await prisma.jigRework.findMany();
  return rows.reduce(
    (
      acc: Record<string, boolean>,
      row: { jigId: string; isRework: boolean },
    ) => {
      acc[row.jigId] = row.isRework;
      return acc;
    },
    {} as Record<string, boolean>,
  );
}

// ============ PO RULES ============

export async function getAllPoRules() {
  return await prisma.poRule.findMany({
    orderBy: {
      priority: "asc",
    },
  });
}

export async function getPoRulesByAccount(contactAccount: string) {
  return await prisma.poRule.findMany({
    where: { contactAccount },
    orderBy: {
      priority: "asc",
    },
  });
}
