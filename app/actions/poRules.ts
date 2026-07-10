"use server";

import { getAllPoRules } from "@/lib/db";
import type { IPoRulesResult } from "@/types/interfaces";

/**
 * Fetches all PO scanning rules from the database.
 * Rules are ordered by priority (lower number = applied first).
 *
 * @returns Result object containing rules array or error message
 */
export async function getPoRules(): Promise<IPoRulesResult> {
  try {
    const res = await getAllPoRules();
    return { success: true, rules: res };
  } catch (error) {
    console.error("Failed to fetch PO Rules", error);
    return { success: false, rules: [], error: "Failed to fetch PO Rules" };
  }
}
