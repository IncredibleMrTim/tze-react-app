-- Add support for multiple PO pages and parts photos
-- Consolidate all photo column migrations into one safe migration

DO $$
BEGIN
  -- Handle poPic -> poPages conversion
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Job' AND column_name = 'poPic'
  ) THEN
    -- Convert poPic to array type
    ALTER TABLE "Job"
    ALTER COLUMN "poPic" TYPE TEXT[]
    USING CASE
      WHEN "poPic" IS NULL THEN ARRAY[]::TEXT[]
      ELSE ARRAY["poPic"]::TEXT[]
    END;

    -- Set default and NOT NULL
    ALTER TABLE "Job"
    ALTER COLUMN "poPic" SET DEFAULT '{}';

    ALTER TABLE "Job"
    ALTER COLUMN "poPic" SET NOT NULL;

    -- Rename to poPages
    ALTER TABLE "Job" RENAME COLUMN "poPic" TO "poPages";
  END IF;

  -- Handle partsPic -> partsOnArrivalPhotos conversion
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Job' AND column_name = 'partsPic'
  ) THEN
    -- Add new column as array type
    ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "partsOnArrivalPhotos" TEXT[] DEFAULT '{}' NOT NULL;

    -- Migrate existing data
    UPDATE "Job"
    SET "partsOnArrivalPhotos" = CASE
      WHEN "partsPic" IS NULL THEN ARRAY[]::TEXT[]
      ELSE ARRAY["partsPic"]::TEXT[]
    END
    WHERE "partsOnArrivalPhotos" = '{}';

    -- Drop old column
    ALTER TABLE "Job" DROP COLUMN "partsPic";
  END IF;
END $$;
