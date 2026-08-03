"use server";

import { getAllJigRework, setJigRework } from "@/lib/db";

export async function getJigReworkAction() {
  try {
    const reworkByJig = await getAllJigRework();
    return { success: true, reworkByJig };
  } catch (error) {
    console.error("Failed to fetch jig rework status:", error);
    return {
      success: false,
      reworkByJig: {} as Record<string, boolean>,
      error: "Failed to fetch jig rework status",
    };
  }
}

export async function setJigReworkAction(jigId: string, isRework: boolean) {
  await setJigRework(jigId, isRework);
}
