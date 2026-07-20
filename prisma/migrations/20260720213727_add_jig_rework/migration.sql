-- CreateTable
CREATE TABLE "JigRework" (
    "id" TEXT NOT NULL,
    "jigName" TEXT NOT NULL,
    "isRework" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JigRework_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JigRework_jigName_key" ON "JigRework"("jigName");

-- CreateIndex
CREATE INDEX "JigRework_jigName_idx" ON "JigRework"("jigName");
