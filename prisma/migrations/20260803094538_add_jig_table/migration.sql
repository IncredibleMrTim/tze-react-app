-- CreateTable
CREATE TABLE "Jig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jig_name_key" ON "Jig"("name");

-- Backfill: one Jig row per distinct jigName ever referenced by an
-- assignment, photo, or rework flag, so nothing gets orphaned below.
INSERT INTO "Jig" ("id", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, names.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "jigName" AS name FROM "JigAssignment"
    UNION
    SELECT DISTINCT "jigName" AS name FROM "JigPhoto"
    UNION
    SELECT DISTINCT "jigName" AS name FROM "JigRework"
) AS names;

-- AlterTable: JigAssignment.jigName -> jigId
ALTER TABLE "JigAssignment" ADD COLUMN "jigId" TEXT;

UPDATE "JigAssignment" a
SET "jigId" = j.id
FROM "Jig" j
WHERE j.name = a."jigName";

ALTER TABLE "JigAssignment" ALTER COLUMN "jigId" SET NOT NULL;

DROP INDEX "JigAssignment_jigName_idx";

ALTER TABLE "JigAssignment" DROP COLUMN "jigName";

-- CreateIndex
CREATE INDEX "JigAssignment_jigId_idx" ON "JigAssignment"("jigId");

-- AddForeignKey
ALTER TABLE "JigAssignment" ADD CONSTRAINT "JigAssignment_jigId_fkey" FOREIGN KEY ("jigId") REFERENCES "Jig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: JigPhoto.jigName -> jigId
ALTER TABLE "JigPhoto" ADD COLUMN "jigId" TEXT;

UPDATE "JigPhoto" p
SET "jigId" = j.id
FROM "Jig" j
WHERE j.name = p."jigName";

ALTER TABLE "JigPhoto" ALTER COLUMN "jigId" SET NOT NULL;

DROP INDEX "JigPhoto_jigName_key";
DROP INDEX "JigPhoto_jigName_idx";

ALTER TABLE "JigPhoto" DROP COLUMN "jigName";

-- CreateIndex
CREATE UNIQUE INDEX "JigPhoto_jigId_key" ON "JigPhoto"("jigId");

-- AddForeignKey
ALTER TABLE "JigPhoto" ADD CONSTRAINT "JigPhoto_jigId_fkey" FOREIGN KEY ("jigId") REFERENCES "Jig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: JigRework.jigName -> jigId
ALTER TABLE "JigRework" ADD COLUMN "jigId" TEXT;

UPDATE "JigRework" r
SET "jigId" = j.id
FROM "Jig" j
WHERE j.name = r."jigName";

ALTER TABLE "JigRework" ALTER COLUMN "jigId" SET NOT NULL;

DROP INDEX "JigRework_jigName_key";
DROP INDEX "JigRework_jigName_idx";

ALTER TABLE "JigRework" DROP COLUMN "jigName";

-- CreateIndex
CREATE UNIQUE INDEX "JigRework_jigId_key" ON "JigRework"("jigId");

-- AddForeignKey
ALTER TABLE "JigRework" ADD CONSTRAINT "JigRework_jigId_fkey" FOREIGN KEY ("jigId") REFERENCES "Jig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
