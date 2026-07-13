-- Convert partsPic from String? to partsOnArrivalPhotos String[] while preserving existing data
-- Existing single images will become single-element arrays

-- Step 1: Add new column as array type
ALTER TABLE "Job" ADD COLUMN "partsOnArrivalPhotos" TEXT[] DEFAULT '{}' NOT NULL;

-- Step 2: Migrate existing data (NULL becomes empty array, non-NULL strings become single-element arrays)
UPDATE "Job"
SET "partsOnArrivalPhotos" = CASE
  WHEN "partsPic" IS NULL THEN ARRAY[]::TEXT[]
  ELSE ARRAY["partsPic"]::TEXT[]
END;

-- Step 3: Drop old column
ALTER TABLE "Job" DROP COLUMN "partsPic";
