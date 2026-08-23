-- JigPhoto becomes append-only (one row per load cycle instead of one
-- shared row per jig) so a cleared JigAssignment can keep a permanent
-- reference to the exact photo from its own load cycle via photoId,
-- instead of completeJigAction copying photoData into JigAssignment.pic
-- and then deleting the shared row.

-- AlterTable: JigAssignment gains photoId (nullable FK, pic kept unused
-- for rollback safety — not dropped in this migration)
ALTER TABLE "JigAssignment" ADD COLUMN "photoId" TEXT;

-- AlterTable: JigPhoto.jigId is no longer 1:1 with Jig
DROP INDEX "JigPhoto_jigId_key";

-- CreateIndex
CREATE INDEX "JigPhoto_jigId_idx" ON "JigPhoto"("jigId");

-- Backfill: give every existing cleared assignment's `pic` snapshot its
-- own permanent JigPhoto row, and point photoId at it. Done via a temp
-- mapping table so the generated id can be reused for both the insert
-- and the update without an unreliable join-back on jigId+pic+timestamp.
CREATE TEMP TABLE "_pic_backfill" AS
SELECT a.id AS "assignmentId", gen_random_uuid()::text AS "photoId", a."jigId", a."pic"
FROM "JigAssignment" a
WHERE a."pic" IS NOT NULL;

INSERT INTO "JigPhoto" ("id", "jigId", "photoData", "createdAt", "updatedAt")
SELECT "photoId", "jigId", "pic", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "_pic_backfill";

UPDATE "JigAssignment" a
SET "photoId" = b."photoId"
FROM "_pic_backfill" b
WHERE a.id = b."assignmentId";

DROP TABLE "_pic_backfill";

-- CreateIndex
CREATE INDEX "JigAssignment_photoId_idx" ON "JigAssignment"("photoId");

-- AddForeignKey
ALTER TABLE "JigAssignment" ADD CONSTRAINT "JigAssignment_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "JigPhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
