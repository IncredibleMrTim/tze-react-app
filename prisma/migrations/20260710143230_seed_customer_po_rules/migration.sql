-- Seed PO scanning rules from hardcoded customer-specific rules
-- These were previously hardcoded in po-scan-prompt.xml
-- Note: Only inserts rules if the corresponding Contact exists

-- Patchell Industries Rules
INSERT INTO "PoRule" ("contactAccount", "ruleType", "scanningRules", "priority", "createdAt", "updatedAt")
SELECT 'PATCHELL', 'CODE_LOCATION', 'Code Location Override: The part code column is labeled "Our ref" (not the standard "Stockcode" or "Part No"). Extract codes from the "Our ref" column exactly as shown.', 0, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Contact" WHERE account = 'PATCHELL')
UNION ALL
SELECT 'PATCHELL', 'OCR_FIX', 'OCR Correction: Patchell codes follow format [LETTER][4-DIGITS]-[SUFFIX]. Valid starting letters are G, D, C, J, SLB, T. The letter "I" (straight line) is almost NEVER correct - it is usually "G" (curved with horizontal bar) misread by OCR. If a code starts with I followed by 4 digits and a dash, replace the I with G. Examples: I0125-007P3 → G0125-007P3, I0319-001P3 → G0319-001P3', 1, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Contact" WHERE account = 'PATCHELL');

-- High Duty Plastics (HDP) Rules
INSERT INTO "PoRule" ("contactAccount", "ruleType", "scanningRules", "priority", "createdAt", "updatedAt")
SELECT 'HDP', 'CODE_PREFIX_STRIP', 'Code Prefix Stripping: HDP codes contain internal tracking prefixes that must be removed. Pattern: X.XXX. (strip everything up to and including the 2nd dot). Examples: 8.088.005040_MAC_003_1A → 005040_MAC_003_1A, 8.068.006024_MAC_001_1A → 006024_MAC_001_1A', 0, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Contact" WHERE account = 'HDP')
UNION ALL
SELECT 'HDP', 'CODE_LOCATION', 'Code Location Enforcement: ALWAYS use the Stockcode column value (after applying prefix stripping). NEVER extract codes from the Description column even if part codes appear there.', 1, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Contact" WHERE account = 'HDP');

-- Baytex Rules
INSERT INTO "PoRule" ("contactAccount", "ruleType", "scanningRules", "priority", "createdAt", "updatedAt")
SELECT 'BAYTEX', 'CODE_LOCATION', 'Code Location Override: Baytex POs have a generic code (227004) in the standard code column on all rows. The ACTUAL part code is embedded in the Description field on the second line in format #XXXXXX. Extract the code from Description line 2 and strip the # symbol. Example: If Description line 2 is "#123456", the code is "123456".', 0, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Contact" WHERE account = 'BAYTEX')
UNION ALL
SELECT 'BAYTEX', 'DESCRIPTION_SPLIT', 'Description Splitting: Baytex embeds multiple data points in the Description field. For the description field in your output, use ONLY line 1 of the Description (the actual part description). Ignore line 2 (which contains the code).', 1, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Contact" WHERE account = 'BAYTEX');
