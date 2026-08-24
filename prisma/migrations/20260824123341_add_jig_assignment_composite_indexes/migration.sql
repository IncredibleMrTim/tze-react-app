-- CreateIndex
CREATE INDEX "JigAssignment_jigId_status_idx" ON "JigAssignment"("jigId", "status");

-- CreateIndex
CREATE INDEX "JigAssignment_jobId_status_idx" ON "JigAssignment"("jobId", "status");
