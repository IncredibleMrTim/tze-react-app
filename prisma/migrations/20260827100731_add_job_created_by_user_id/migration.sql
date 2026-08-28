-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Job_createdByUserId_idx" ON "Job"("createdByUserId");
