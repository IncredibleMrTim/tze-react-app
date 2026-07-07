"use server";

import type { IContact, IPart } from "@/types/interfaces";
import { resolveCustomer } from "@/lib/helpers";
import { callClaudeWithImage } from "@/lib/claude-api";
import { matchScannedParts, type ScannedPart } from "@/lib/part-matcher";
import { PO_SCAN_SYSTEM_PROMPT } from "@/constants/prompts";
import { getContacts } from "@/lib/db";

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

export async function scanPODocument(
  base64Data: string,
): Promise<ScanPOResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("No API key configured");
  }

  // Call Claude API to extract PO data
  const rawResponse = await callClaudeWithImage({
    base64Data,
    systemPrompt: PO_SCAN_SYSTEM_PROMPT,
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
    throw new Error("Could not parse JSON response from Claude API", {
      cause: error,
    });
  }
  console.log("T2 - Parsed from Claude:", parsed.customer_name);
  const po_number = parsed.po_number || "";
  const customer_name = parsed.customer_name || "";
  const scannedParts = parsed.parts || [];
  const urgent = rawResponse.toUpperCase().includes("URGENT");

  console.log("T2 - Scanned parts from Claude:", scannedParts);

  // Fetch contacts from database and resolve customer
  const contacts = await getContacts();
  const customer = customer_name ? resolveCustomer(customer_name, contacts) : null;
  console.log("T2 - Customer resolved:", customer?.name || "NOT FOUND");

  // Match scanned parts to inventory
  const parts = matchScannedParts(scannedParts, customer);
  console.log("T2 - Matched parts:", parts);

  return {
    po_number,
    customer_name,
    customer,
    parts,
    raw: rawResponse,
    urgent,
  };
}
