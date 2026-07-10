import { NextRequest, NextResponse } from "next/server";
import { getContactByAccount } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ account: string }> },
) {
  try {
    const { account } = await params;
    const contact = await getContactByAccount(account);

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Failed to fetch contact", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 },
    );
  }
}
