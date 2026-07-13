-- Fix migration: safely rename partsPhotos to partsOnArrivalPhotos if needed
-- This handles the case where the previous migration failed

DO $$
BEGIN
  -- Check if partsPhotos column exists and partsOnArrivalPhotos doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Job' AND column_name = 'partsPhotos'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Job' AND column_name = 'partsOnArrivalPhotos'
  ) THEN
    -- Rename the column
    ALTER TABLE "Job" RENAME COLUMN "partsPhotos" TO "partsOnArrivalPhotos";
  END IF;

  -- If partsPhotos doesn't exist but partsOnArrivalPhotos does, we're good
  -- If neither exist, that's a problem (but unlikely at this point)
  -- If both exist, that's also a problem
END $$;
