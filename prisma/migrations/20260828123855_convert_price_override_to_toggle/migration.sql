-- Split "priceOverride" (nullable float override amount) into a
-- freightRequested-style pair: a boolean toggle plus its value, so the
-- intake editor can show/hide the amount field the same way it does for
-- freight. Existing override amounts are preserved in priceOverrideValue
-- before priceOverride is converted to a boolean flag.

-- Backfill the new value column from the existing override amount
ALTER TABLE "Job" ADD COLUMN "priceOverrideValue" DOUBLE PRECISION;
UPDATE "Job" SET "priceOverrideValue" = COALESCE("priceOverride", 0);
ALTER TABLE "Job" ALTER COLUMN "priceOverrideValue" SET NOT NULL;

-- Convert priceOverride from "the override amount, or null" to
-- "is an override active" — true wherever an amount was previously set
ALTER TABLE "Job" ALTER COLUMN "priceOverride" TYPE BOOLEAN USING ("priceOverride" IS NOT NULL);
ALTER TABLE "Job" ALTER COLUMN "priceOverride" SET NOT NULL;
