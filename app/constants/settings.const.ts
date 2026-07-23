import type { ISettings } from "@/types/interfaces";

export const DEFAULT_SETTINGS: ISettings = {
  goldMinCharge: 70,
  silverMinCharge: 60,
  silverKg: 2.6,
  goldKg: 2.9,
  silverJig: 360,
  goldJig: 400,
  dueDays: 20,
  jigCount: 6,
  invSeqStart: 1,
  invSeq: 1,
  stringRate: 25,
};

export const generateJigsList = (count: number): string[] => {
  const n = Math.max(1, Math.min(20, count));
  const list: string[] = [];
  for (let i = 1; i <= n; i++) {
    list.push(`JIG-${String(i).padStart(2, "0")}`);
  }
  return list;
};

export const calculateRates = (
  settings: ISettings,
): Record<
  "silver" | "gold",
  { kg: number; jig: number; minCharge: number }
> => {
  return {
    silver: {
      kg: settings.silverKg || 2.6,
      jig: settings.silverJig || 360,
      minCharge: settings.silverMinCharge || 60,
    },
    gold: {
      kg: settings.goldKg || 2.9,
      jig: settings.goldJig || 400,
      minCharge: settings.goldMinCharge || 70,
    },
  };
};

export const calculateMinCharges = (
  settings: ISettings,
): Record<"silver" | "gold", number> => {
  const rates = calculateRates(settings);
  return {
    silver: rates.silver.minCharge,
    gold: rates.gold.minCharge,
  };
};
