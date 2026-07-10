"use server";

import { searchItems } from "@/lib/db";
import type { IPart } from "@/types/interfaces";

/**
 * Refines scanned parts by searching the database for exact matches.
 * Updates part codes, descriptions, and prices based on database items.
 *
 * @param parts - Array of parts from PO scan
 * @returns Array of parts with database-matched details
 */
export async function refinePartsAction(parts: IPart[]): Promise<IPart[]> {
  return await Promise.all(
    parts.map(async (part) => {
      try {
        // Search database for this part code
        const searchResults = await searchItems(part.code);

        if (searchResults.length === 0) {
          return part; // No matches found, return original
        }

        // Find exact code match (case-insensitive)
        const exactMatch = searchResults.find(
          (item) => item.code.toLowerCase() === part.code.toLowerCase(),
        );

        if (exactMatch) {
          return {
            ...part,
            code: exactMatch.code,
            desc: exactMatch.desc,
            price: exactMatch.price,
          };
        }

        // Use first search result if no exact match
        const firstMatch = searchResults[0];
        return {
          ...part,
          code: firstMatch.code,
          desc: firstMatch.desc,
          price: firstMatch.price,
        };
      } catch (error) {
        console.error(`Error refining part ${part.code}:`, error);
        return part; // Return original on error
      }
    }),
  );
}
