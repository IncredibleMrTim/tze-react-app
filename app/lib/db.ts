import { prisma } from './prisma'
import type { IJob, IJigAssignment, IContact, IItem } from '@/types/interfaces'

// ============ BIGINT CONVERSION HELPERS ============

// Convert BigInt fields to Number for JSON serialization
function serializeJob(job: any): any {
  return {
    ...job,
    createdAt: Number(job.createdAt),
    dispatchedAt: job.dispatchedAt ? Number(job.dispatchedAt) : null,
    jigAssignments: job.jigAssignments?.map(serializeJigAssignment) || undefined,
  }
}

function serializeJigAssignment(assignment: any): any {
  return {
    ...assignment,
    completedAt: assignment.completedAt ? Number(assignment.completedAt) : null,
    loadedAt: Number(assignment.loadedAt),
    job: assignment.job ? serializeJob(assignment.job) : undefined,
  }
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
      poPic: job.poPic,
      partsPic: job.partsPic,
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
  })

  return serializeJob(created)
}

export async function updateJob(jobId: string, job: Partial<IJob>) {
  const updateData: any = { ...job }

  // Convert timestamp fields to BigInt if present
  if (job.createdAt !== undefined) updateData.createdAt = BigInt(job.createdAt)
  if (job.dispatchedAt !== undefined) {
    updateData.dispatchedAt = job.dispatchedAt ? BigInt(job.dispatchedAt) : null
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: updateData,
  })

  return serializeJob(updated)
}

export async function deleteJob(jobId: string) {
  return await prisma.job.delete({
    where: { id: jobId },
  })
}

export async function getJobs() {
  const jobs = await prisma.job.findMany({
    include: {
      jigAssignments: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return jobs.map(serializeJob)
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
      jigName: assignment.jigName,
      pct: assignment.pct,
      pic: assignment.pic,
      completedAt: assignment.completedAt ? BigInt(assignment.completedAt) : null,
      loadedAt: BigInt(assignment.loadedAt),
      status: assignment.status,
    },
  })

  return serializeJigAssignment(created)
}

export async function updateJigAssignment(assignmentId: string, assignment: Partial<IJigAssignment>) {
  const updateData: any = { ...assignment }

  if (assignment.completedAt !== undefined) {
    updateData.completedAt = assignment.completedAt ? BigInt(assignment.completedAt) : null
  }
  if (assignment.loadedAt !== undefined) {
    updateData.loadedAt = BigInt(assignment.loadedAt)
  }

  const updated = await prisma.jigAssignment.update({
    where: { id: assignmentId },
    data: updateData,
  })

  return serializeJigAssignment(updated)
}

export async function deleteJigAssignment(assignmentId: string) {
  return await prisma.jigAssignment.delete({
    where: { id: assignmentId },
  })
}

export async function getJigAssignments() {
  const assignments = await prisma.jigAssignment.findMany({
    include: {
      job: true,
    },
  })

  return assignments.map(serializeJigAssignment)
}

export async function deleteJigAssignmentsByJobId(jobId: string) {
  return await prisma.jigAssignment.deleteMany({
    where: { jobId },
  })
}

// ============ ITEMS ============

export async function getItems() {
  return await prisma.item.findMany({
    orderBy: {
      code: 'asc',
    },
  })
}

export async function getItemsByCustomer(customer: string) {
  return await prisma.item.findMany({
    where: { customer },
    orderBy: {
      code: 'asc',
    },
  })
}

export async function searchItems(query: string) {
  return await prisma.item.findMany({
    where: {
      OR: [
        { code: { contains: query, mode: 'insensitive' } },
        { desc: { contains: query, mode: 'insensitive' } },
        { customer: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: {
      code: 'asc',
    },
  })
}

// ============ CONTACTS ============

export async function getContacts() {
  return await prisma.contact.findMany({
    orderBy: {
      name: 'asc',
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
        { name: { contains: query, mode: 'insensitive' } },
        { account: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: {
      name: 'asc',
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
        apiKey: process.env.ANTHROPIC_API_KEY || '',
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

export async function updateSettings(settings: Partial<any>) {
  return await prisma.settings.update({
    where: { id: 1 },
    data: settings,
  })
}

// ============ JIG PHOTOS ============

export async function getJigPhoto(jigName: string) {
  return await prisma.jigPhoto.findUnique({
    where: { jigName },
  })
}

export async function setJigPhoto(jigName: string, photoData: string) {
  return await prisma.jigPhoto.upsert({
    where: { jigName },
    update: { photoData },
    create: { jigName, photoData },
  })
}

export async function getAllJigPhotos() {
  const photos = await prisma.jigPhoto.findMany()
  return photos.reduce((acc, photo) => {
    acc[photo.jigName] = photo.photoData
    return acc
  }, {} as Record<string, string>)
}
