import { NextRequest, NextResponse } from "next/server";
import type { IContact, IPart } from "@/types/interfaces";
import { resolveCustomer } from "@/lib/helpers";
import { callClaudeWithImage } from "@/lib/claude-api";
import { matchScannedParts, type ScannedPart } from "@/lib/part-matcher";
import { buildPOScanPrompt } from "@/lib/prompt-builder";
import { getContacts, getItems } from "@/lib/db";

interface POScanResult {
  po_number: string;
  customer_name: string;
  parts: ScannedPart[];
}

export interface ScanPOResponse {
  po_number: string;
  customer_name: string;
  customer: IContact | null;
  parts: IPart[];
  raw: string;
  urgent: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { base64DataArray } = await request.json();

    if (!Array.isArray(base64DataArray) || base64DataArray.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty base64DataArray" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key configured" },
        { status: 500 }
      );
    }

    // Build dynamic prompt with database rules
    const systemPrompt = await buildPOScanPrompt();
    console.log("📋 Using prompt with database rules");

    // Call Claude API to extract PO data (supports multi-page)
    const rawResponse = await callClaudeWithImage({
      base64DataArray,
      systemPrompt,
      maxTokens: 2500,
      apiKey,
    });

    console.log("📄 Raw Claude response:", rawResponse);
    console.log("📄 Response length:", rawResponse.length);

    // Parse the JSON response
    let parsed: POScanResult;
    try {
      parsed = JSON.parse(rawResponse);
    } catch (error) {
      console.error("❌ Failed to parse JSON. Raw response:", rawResponse);
      return NextResponse.json(
        { error: "Could not parse JSON response from Claude API" },
        { status: 500 }
      );
    }

    console.log("T2 - Parsed from Claude:", parsed.customer_name);
    const po_number = parsed.po_number || "";
    const customer_name = parsed.customer_name || "";
    const scannedParts = parsed.parts || [];
    const urgent = rawResponse.toUpperCase().includes("URGENT");

    console.log("T2 - Scanned parts from Claude:", scannedParts);

    // Fetch contacts and items from database
    const [contacts, items] = await Promise.all([
      getContacts(),
      getItems()
    ]);

    // Resolve customer
    const customer = customer_name ? resolveCustomer(customer_name, contacts) : null;
    console.log("T2 - Customer resolved:", customer?.name || "NOT FOUND");

    // Match scanned parts to inventory using loaded items
    const parts = matchScannedParts(scannedParts, customer, items);
    console.log("T2 - Matched parts:", parts);

    const response: ScanPOResponse = {
      po_number,
      customer_name,
      customer,
      parts,
      raw: rawResponse,
      urgent,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in scan-po API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
