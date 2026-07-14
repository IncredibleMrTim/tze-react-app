import { readFileSync } from "fs";
import { join } from "path";
import { getAllPoRules, getContacts } from "@/lib/db";

/**
 * Build PO scan system prompt with dynamic rules and customer aliases
 *
 * Loads the base XML prompt template and injects:
 * 1. Customer-specific scanning rules from PoRule table
 * 2. Customer name aliases from Contact table
 *
 * If no database rules exist, returns the base template as-is (fallback).
 *
 * @returns Complete system prompt with injected rules and aliases
 */
export async function buildPOScanPrompt(): Promise<string> {
  // Load base XML prompt template
  const basePrompt = readFileSync(
    join(process.cwd(), "app/constants/po-scan-prompt.xml"),
    "utf-8",
  );

  try {
    // Fetch rules and contacts from database
    const [poRules, contacts] = await Promise.all([
      getAllPoRules(),
      getContacts(),
    ]);

    console.log(`📋 Loaded ${poRules.length} PO rules, ${contacts.length} contacts from database`);

    // Build customer aliases mapping
    const customerAliases = contacts
      .filter((c) => c.alias && c.alias.length > 0)
      .map((c) => {
        const aliases = c.alias.join('", "');
        return `      <mapping>
        <variations>"${c.name}", "${aliases}"</variations>
        <standardized>${c.name}</standardized>
      </mapping>`;
      })
      .join("\n");

    // Build dynamic rules section in XML format
    const dynamicRules = poRules
      .map((rule) => {
        return `    <rule name="${rule.ruleType}_${rule.contactAccount}" priority="${rule.priority}">
      ${rule.scanningRules}
    </rule>`;
      })
      .join("\n\n");

    // Inject customer aliases into <output> section
    const outputMarker = "<step>3. Applying these specific mappings if found:";
    const outputEndMarker = "</step>";
    const outputStart = basePrompt.indexOf(outputMarker);
    const outputEnd = basePrompt.indexOf(outputEndMarker, outputStart);

    let promptWithAliases = basePrompt;
    if (outputStart !== -1 && outputEnd !== -1 && customerAliases) {
      promptWithAliases =
        basePrompt.slice(0, outputStart) +
        `<step>3. Applying these database customer mappings:
${customerAliases}
    ` +
        basePrompt.slice(outputEnd);
    }

    // Find the special_rules section and inject dynamic rules
    const startMarker = "<special_rules>";
    const endMarker = "</special_rules>";

    const startIndex = promptWithAliases.indexOf(startMarker);
    const endIndex = promptWithAliases.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      console.warn(
        "⚠️  Could not find <special_rules> section, appending rules to end",
      );
      return `${promptWithAliases}\n\n<!-- Database Rules -->\n${dynamicRules}`;
    }

    // Replace the special_rules section content with database rules
    const enhancedPrompt =
      promptWithAliases.slice(0, startIndex + startMarker.length) +
      `
    <!-- Dynamic rules loaded from database (ordered by priority) -->

${dynamicRules}

  ` +
      promptWithAliases.slice(endIndex);

    return enhancedPrompt;
  } catch (error) {
    console.error("❌ Failed to load PO rules from database:", error);
    console.log("📋 Falling back to base prompt");
    return basePrompt;
  }
}

/**
 * Get the base PO scan prompt without dynamic rules
 * Useful for preview/comparison purposes
 */
export function getBasePOScanPrompt(): string {
  return readFileSync(
    join(process.cwd(), "app/constants/po-scan-prompt.xml"),
    "utf-8",
  );
}
