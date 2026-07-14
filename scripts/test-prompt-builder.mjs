import { readFileSync } from 'fs';
import { join } from 'path';

// Simulate the prompt builder
async function testPromptBuilder() {
  // Load base XML
  const basePrompt = readFileSync(
    join(process.cwd(), 'app/constants/po-scan-prompt.xml'),
    'utf-8'
  );

  // Simulate database rules (using the actual structure from the API)
  const poRules = [
    {
      id: 3,
      contactAccount: "PATI",
      ruleType: "CODE_LOCATION",
      scanningRules: "Code Location Override: The part code column is labeled \"Our ref\" (not the standard \"Stockcode\" or \"Part No\"). Extract codes from the \"Our ref\" column exactly as shown.",
      priority: 0
    },
    {
      id: 4,
      contactAccount: "PATI",
      ruleType: "OCR_FIX",
      scanningRules: "OCR Correction: Patchell codes follow format [LETTER][4-DIGITS]-[SUFFIX]. Valid starting letters are G, D, C, J, SLB, T. The letter \"I\" (straight line) is almost NEVER correct - it is usually \"G\" (curved with horizontal bar) misread by OCR. If a code starts with I followed by 4 digits and a dash, replace the I with G. Examples: I0125-007P3 → G0125-007P3, I0319-001P3 → G0319-001P3",
      priority: 1
    },
    {
      id: 5,
      contactAccount: "HDP",
      ruleType: "CODE_PREFIX_STRIP",
      scanningRules: "Code Prefix Stripping: HDP codes contain internal tracking prefixes that must be removed. Pattern: X.XXX. (strip everything up to and including the 2nd dot). Examples: 8.088.005040_MAC_003_1A → 005040_MAC_003_1A, 8.068.006024_MAC_001_1A → 006024_MAC_001_1A",
      priority: 0
    }
  ];

  // Build dynamic rules
  const dynamicRules = poRules
    .map((rule) => {
      return `    <rule name="${rule.ruleType}_${rule.contactAccount}" priority="${rule.priority}">
      ${rule.scanningRules}
    </rule>`;
    })
    .join('\n\n');

  // Inject into prompt
  const startMarker = '<special_rules>';
  const endMarker = '</special_rules>';
  const startIndex = basePrompt.indexOf(startMarker);
  const endIndex = basePrompt.indexOf(endMarker);

  const enhancedPrompt =
    basePrompt.slice(0, startIndex + startMarker.length) +
    `
    <!-- Dynamic rules loaded from database (ordered by priority) -->

${dynamicRules}

  ` +
    basePrompt.slice(endIndex);

  // Extract just the special_rules section for inspection
  const rulesStart = enhancedPrompt.indexOf('<special_rules>');
  const rulesEnd = enhancedPrompt.indexOf('</special_rules>') + '</special_rules>'.length;
  const rulesSection = enhancedPrompt.slice(rulesStart, rulesEnd);

  console.log('\n📋 Injected Rules Section:\n');
  console.log(rulesSection);
  console.log('\n✅ Total prompt length:', enhancedPrompt.length, 'characters');
  console.log('✅ Number of rules injected:', poRules.length);

  // Check for duplicates or issues
  const ruleNames = poRules.map(r => `${r.ruleType}_${r.contactAccount}`);
  const uniqueRules = new Set(ruleNames);

  if (ruleNames.length !== uniqueRules.size) {
    console.warn('⚠️  WARNING: Duplicate rule names detected!');
  } else {
    console.log('✅ All rules have unique names');
  }
}

testPromptBuilder().catch(console.error);
