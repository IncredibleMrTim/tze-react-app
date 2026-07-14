import { NextRequest, NextResponse } from "next/server";
import { getItems, getItemsByCustomer } from "@/lib/db";

/**
 * GET /api/items/[query]
 *
 * Fetches items for a specific customer account.
 * Returns items where customer matches the query OR customer is null (generic items).
 *
 * Example: GET /api/items/GAM returns all items for customer "GAM" + generic items
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ query: string }> },
) {
  try {
    const { query } = await params;

    if (query) {
      // Fetch items for this customer account + generic items
      const items = await getItemsByCustomer(query);
      return NextResponse.json(items);
    }

    // No query - return all items
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
