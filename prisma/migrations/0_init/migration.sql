-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JigAssignmentStatus" AS ENUM ('ACTIVE', 'CLEARED');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "customer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "alias" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_account" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_contact" TEXT NOT NULL,
    "parts" JSONB NOT NULL,
    "plating" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "stringCount" INTEGER NOT NULL,
    "stringsRequired" BOOLEAN NOT NULL,
    "requiresWeighing" BOOLEAN NOT NULL,
    "freightRequested" BOOLEAN NOT NULL,
    "minCharge" BOOLEAN NOT NULL,
    "flagged" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,
    "poPic" TEXT,
    "partsPic" TEXT,
    "manualPO" BOOLEAN NOT NULL,
    "urgent" BOOLEAN NOT NULL,
    "isInternal" BOOLEAN NOT NULL,
    "isRework" BOOLEAN NOT NULL,
    "partDescription" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "priceOverride" DOUBLE PRECISION,
    "freightCost" DOUBLE PRECISION NOT NULL,
    "dispatchedAt" BIGINT,
    "invoiceNumber" TEXT,
    "poComplete" BOOLEAN NOT NULL DEFAULT false,
    "fpnDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "fpnHidden" BOOLEAN NOT NULL DEFAULT false,
    "csvDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JigAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jigName" TEXT NOT NULL,
    "pct" DOUBLE PRECISION NOT NULL,
    "pic" TEXT,
    "completedAt" BIGINT,
    "loadedAt" BIGINT NOT NULL,
    "status" "JigAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JigAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "apiKey" TEXT NOT NULL,
    "silverKg" DOUBLE PRECISION NOT NULL,
    "goldKg" DOUBLE PRECISION NOT NULL,
    "silverJig" DOUBLE PRECISION NOT NULL,
    "goldJig" DOUBLE PRECISION NOT NULL,
    "dueDays" INTEGER NOT NULL,
    "jigCount" INTEGER NOT NULL,
    "invSeqStart" INTEGER NOT NULL,
    "stringRate" DOUBLE PRECISION NOT NULL,
    "invSeq" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JigPhoto" (
    "id" TEXT NOT NULL,
    "jigName" TEXT NOT NULL,
    "photoData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JigPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_code_key" ON "Item"("code");

-- CreateIndex
CREATE INDEX "Item_customer_idx" ON "Item"("customer");

-- CreateIndex
CREATE INDEX "Item_code_idx" ON "Item"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_account_key" ON "Contact"("account");

-- CreateIndex
CREATE INDEX "Contact_account_idx" ON "Contact"("account");

-- CreateIndex
CREATE UNIQUE INDEX "Job_po_number_key" ON "Job"("po_number");

-- CreateIndex
CREATE INDEX "Job_po_number_idx" ON "Job"("po_number");

-- CreateIndex
CREATE INDEX "Job_customer_account_idx" ON "Job"("customer_account");

-- CreateIndex
CREATE INDEX "Job_poComplete_idx" ON "Job"("poComplete");

-- CreateIndex
CREATE INDEX "Job_dispatchedAt_idx" ON "Job"("dispatchedAt");

-- CreateIndex
CREATE INDEX "JigAssignment_jobId_idx" ON "JigAssignment"("jobId");

-- CreateIndex
CREATE INDEX "JigAssignment_jigName_idx" ON "JigAssignment"("jigName");

-- CreateIndex
CREATE INDEX "JigAssignment_status_idx" ON "JigAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JigPhoto_jigName_key" ON "JigPhoto"("jigName");

-- CreateIndex
CREATE INDEX "JigPhoto_jigName_idx" ON "JigPhoto"("jigName");

-- AddForeignKey
ALTER TABLE "JigAssignment" ADD CONSTRAINT "JigAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

