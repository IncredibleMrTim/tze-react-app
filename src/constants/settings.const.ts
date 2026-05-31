import type { ISettings } from "@/interfaces";

export const DEFAULT_SETTINGS: ISettings = {
  apiKey: '',
  silverKg: 2.60,
  goldKg: 2.90,
  silverJig: 360,
  goldJig: 400,
  dueDays: 20,
  jigCount: 6,
  invSeqStart: 1,
  stringRate: 25,
};

export const generateJigsList = (count: number): string[] => {
  const n = Math.max(1, Math.min(20, count));
  const list: string[] = [];
  for (let i = 1; i <= n; i++) {
    list.push(`JIG-${String(i).padStart(2, '0')}`);
  }
  return list;
};

export const calculateRates = (settings: ISettings) => {
  return {
    silver: {
      kg: settings.silverKg || 2.60,
      jig: settings.silverJig || 360,
    },
    gold: {
      kg: settings.goldKg || 2.90,
      jig: settings.goldJig || 400,
    },
  };
};

export const calculateMinCharges = (settings: ISettings) => {
  const rates = calculateRates(settings);
  return {
    silver: Math.round(rates.silver.jig / 6),
    gold: Math.round(rates.gold.jig / 6),
  };
};
