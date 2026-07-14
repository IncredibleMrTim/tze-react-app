import { NextRequest, NextResponse } from "next/server";
import { getItems, searchItems } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ query: string }> },
) {
  try {
    const { query } = await params;

    if (query) {
      const items = await searchItems(query);
      return NextResponse.json(items);
    }

    const items = await getItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 },
    );
  }
}
