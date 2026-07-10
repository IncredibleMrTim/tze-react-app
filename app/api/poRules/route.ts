import { NextResponse } from "next/server";
import { getPoRules } from "@/actions/poRules";

export async function GET() {
  try {
    const result = await getPoRules();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.rules);
  } catch (error) {
    console.error("Failed to fetch PO Rules", error);
    return NextResponse.json(
      {
        error: "Failed to fetch PO Rules",
      },
      { status: 500 },
    );
  }
}
