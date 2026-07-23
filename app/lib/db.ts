import { prisma } from "./prisma";
import type { Job, JigAssignment } from "@prisma/client";
import type { IJob, IJigAssignment, ISettings } from "@/types/interfaces";
import { notify } from "./notify";

// ============ BIGINT CONVERSION HELPERS ============

type JobWithRelations = Job & { jigAssignments?: JigAssignment[] };
type JigAssignmentWithRelations = JigAssignment & { job?: Job };

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
      jigName: assignment.jigName,
      pct: assignment.pct,
      pic: assignment.pic,
      completedAt: assignment.completedAt
        ? BigInt(assignment.completedAt)
        : null,
      loadedAt: BigInt(assignment.loadedAt),
      status: assignment.status,
    },
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
      jigName: true,
    },
  });

  return assignment?.jigName || null;
}

export async function getJobJigNames(jobId: string): Promise<string[]> {
  const assignments = await prisma.jigAssignment.findMany({
    where: {
      jobId,
      status: "ACTIVE",
    },
    select: {
      jigName: true,
    },
  });

  return assignments.map((a) => a.jigName);
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
      OR: [{ customer: customerAccount }, { customer: "" }],
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
        apiKey: process.env.ANTHROPIC_API_KEY || "",
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

// ============ JIG PHOTOS ============

export async function getJigPhoto(jigName: string) {
  return await prisma.jigPhoto.findUnique({
    where: { jigName },
  });
}

export async function setJigPhoto(jigName: string, photoData: string) {
  return await prisma.jigPhoto.upsert({
    where: { jigName },
    update: { photoData },
    create: { jigName, photoData },
  });
}

export async function getAllJigPhotos() {
  const photos = await prisma.jigPhoto.findMany();
  return photos.reduce(
    (
      acc: Record<string, string>,
      photo: { jigName: string; photoData: string },
    ) => {
      acc[photo.jigName] = photo.photoData;
      return acc;
    },
    {} as Record<string, string>,
  );
}

export async function deleteJigPhoto(jigName: string) {
  return await prisma.jigPhoto.deleteMany({
    where: { jigName },
  });
}

// ============ JIG REWORK ============

export async function setJigRework(jigName: string, isRework: boolean) {
  return await prisma.jigRework.upsert({
    where: { jigName },
    update: { isRework },
    create: { jigName, isRework },
  });
}

export async function deleteJigRework(jigName: string) {
  return await prisma.jigRework.deleteMany({
    where: { jigName },
  });
}

export async function getAllJigRework() {
  const rows = await prisma.jigRework.findMany();
  return rows.reduce(
    (
      acc: Record<string, boolean>,
      row: { jigName: string; isRework: boolean },
    ) => {
      acc[row.jigName] = row.isRework;
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
