-- Convert poPic from String? to String[] while preserving existing data
-- Existing single images will become single-element arrays

-- AlterTable: Convert poPic to array type
-- NULL values stay NULL initially, non-NULL strings become single-element arrays
ALTER TABLE "Job"
ALTER COLUMN "poPic" TYPE TEXT[]
USING CASE
  WHEN "poPic" IS NULL THEN ARRAY[]::TEXT[]
  ELSE ARRAY["poPic"]::TEXT[]
END;

-- Set default to empty array
ALTER TABLE "Job"
ALTER COLUMN "poPic" SET DEFAULT '{}';

-- Make column NOT NULL since we have a default
ALTER TABLE "Job"
ALTER COLUMN "poPic" SET NOT NULL;
