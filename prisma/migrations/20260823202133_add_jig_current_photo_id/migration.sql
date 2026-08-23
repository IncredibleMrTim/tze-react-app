-- Jig.currentPhotoId becomes the single source of truth for "the live
-- photo for this jig right now" — set when a photo is uploaded, cleared
-- (set to null) when the jig completes or empties out. This replaces
-- inferring "live" from whether any JigAssignment references a JigPhoto
-- row via photoId, which broke as soon as the referencing assignment
-- itself got deleted (e.g. its job was removed), leaving an orphaned row
-- that looked "unreferenced" and therefore live again even though the
-- jig had long since moved on.

-- AlterTable
ALTER TABLE "Jig" ADD COLUMN "currentPhotoId" TEXT;

-- Backfill: one-time snapshot of today's "most recent unreferenced photo
-- per jig" heuristic, so currently-loaded jigs keep showing their photo.
UPDATE "Jig" j
SET "currentPhotoId" = live."id"
FROM (
    SELECT DISTINCT ON (p."jigId") p."id", p."jigId"
    FROM "JigPhoto" p
    WHERE NOT EXISTS (
        SELECT 1 FROM "JigAssignment" a WHERE a."photoId" = p."id"
    )
    ORDER BY p."jigId", p."createdAt" DESC
) AS live
WHERE j."id" = live."jigId";

-- CreateIndex
CREATE INDEX "Jig_currentPhotoId_idx" ON "Jig"("currentPhotoId");

-- AddForeignKey
ALTER TABLE "Jig" ADD CONSTRAINT "Jig_currentPhotoId_fkey" FOREIGN KEY ("currentPhotoId") REFERENCES "JigPhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
