import { z } from "zod";

/**
 * A required numeric form field: rejects blank/whitespace-only text (the
 * settings form's inputs hold raw typed text, not parsed numbers — see
 * SettingsClient's handleNumberChange), then coerces and validates the rest.
 */
function requiredNumberField(options: {
  integer?: boolean;
  min?: number;
  max?: number;
} = {}) {
  return z
    .string()
    .trim()
    .min(1, "Required")
    .transform((value, ctx) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        ctx.addIssue({ code: "custom", message: "Must be a valid number" });
        return z.NEVER;
      }
      return parsed;
    })
    .refine(
      (value) => !options.integer || Number.isInteger(value),
      "Must be a whole number",
    )
    .refine(
      (value) => options.min === undefined || value >= options.min,
      `Must be at least ${options.min}`,
    )
    .refine(
      (value) => options.max === undefined || value <= options.max,
      `Must be at most ${options.max}`,
    );
}

/**
 * Validates the settings form's raw input text — every field is required
 * (populated), matching the ISettings fields editable from the settings page.
 */
export const settingsFormSchema = z.object({
  silverKg: requiredNumberField({ min: 0 }),
  goldKg: requiredNumberField({ min: 0 }),
  silverJig: requiredNumberField({ min: 0 }),
  goldJig: requiredNumberField({ min: 0 }),
  silverMinCharge: requiredNumberField({ min: 0 }),
  goldMinCharge: requiredNumberField({ min: 0 }),
  stringRate: requiredNumberField({ min: 0 }),
  dueDays: requiredNumberField({ integer: true, min: 0 }),
  invSeqStart: requiredNumberField({ integer: true, min: 1 }),
  jigCount: requiredNumberField({ integer: true, min: 1, max: 20 }),
});

export type SettingsFormInput = z.input<typeof settingsFormSchema>;
export type SettingsFormValues = z.output<typeof settingsFormSchema>;
