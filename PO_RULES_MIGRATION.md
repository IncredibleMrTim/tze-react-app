# PO Rules Migration Guide

## What Changed

✅ **Before:** PO scanning rules hardcoded in XML/Markdown files  
✅ **After:** Rules stored in database, managed via UI (future), no deployments needed

## How It Works Now

1. **scan-po route** loads rules from `PoRule` table via `buildPOScanPrompt()`
2. Rules are injected into the system prompt dynamically
3. Rules are ordered by `priority` (lower number = applied first)
4. If no database rules exist, falls back to base prompt template

## Database Schema

```typescript
interface IPoRule {
  id: number;
  contactAccount: string;  // Customer account (e.g., "PATCHE")
  ruleType: string;        // Rule category (e.g., "OCR_CORRECTION", "PREFIX_STRIP")
  scanningRules: string;   // Markdown-formatted rule text
  priority: number;        // Order of application (lower = first)
  createdAt: Date;
  updatedAt: Date;
}
```

## Converting Existing XML Rules to Database

### Example: Patchell OCR Correction Rule

**Before (XML in po-scan-prompt.xml):**
```xml
<rule name="PATCHELL">
  For Patchell Industries POs, the code column is labelled "Our ref" and contains codes like G0125-007P3 or G0319-001P3. Use these exactly as written. Ignore any "Your Part No" references in the description area.

  CRITICAL: Patchell codes always start with a capital letter followed immediately by 4 digits then a dash. The most common starting letters are G, D, C, J, SLB, T. The letter I (capital i) almost NEVER starts a Patchell code.

  Read the first character of each code very carefully — the letter G (which has a curved body and a horizontal bar inside) is extremely commonly misread as I (a straight vertical line).

  RULE: If a scanned code starts with I followed by 4 digits and a dash (e.g. I0125-007P3, I0319-001P3), you MUST correct it to G (e.g. G0125-007P3, G0319-001P3). Apply this correction before returning the code.
</rule>
```

**After (Database insert):**
```sql
INSERT INTO "PoRule" (
  "contactAccount",
  "ruleType", 
  "scanningRules",
  "priority"
) VALUES (
  'PATCHE',
  'OCR_CORRECTION',
  '**Customer:** Patchell Industries

**Code Location:** "Our ref" column

**Code Format:** `[LETTER][4-DIGITS]-[SUFFIX]` (e.g., G0125-007P3, G0319-001P3)

**Valid Starting Letters:** G, D, C, J, SLB, T

**OCR Correction Rule:**
The letter I (straight vertical line) is almost NEVER correct — it's usually G (curved with horizontal bar).

**Action:** If code starts with `I` + 4 digits + dash → Replace `I` with `G`

**Examples:**
- `I0125-007P3` → `G0125-007P3`
- `I0319-001P3` → `G0319-001P3`

**Important:** Ignore any "Your Part No" references in the description area.',
  10
);
```

### Example: HDP Prefix Stripping Rule

**Before (XML):**
```xml
<rule name="HDP">
  For High Duty Plastics (HDP) POs, the Stockcode column on the far left shows codes starting with a numeric prefix like "8.088." or "8.068." or similar "8.XXX." pattern, followed by the real part code.
  
  Strip everything up to and including the second dot, keeping only the actual part code.
</rule>
```

**After (Database):**
```sql
INSERT INTO "PoRule" (
  "contactAccount",
  "ruleType",
  "scanningRules", 
  "priority"
) VALUES (
  'HIGHDU',
  'PREFIX_STRIP',
  '**Customer:** High Duty Plastics (HDP)

**Code Location:** Stockcode column (far left)

**Prefix Pattern:** `X.XXX.` (numeric prefix like "8.088." or "8.068.")

**Action:** Strip everything up to and including the second dot

**Examples:**
- `8.088.005040_MAC_003_1A` → `005040_MAC_003_1A`
- `8.068.006024_MAC_001_1A` → `006024_MAC_001_1A`

**Important:** Always use the Stockcode column after stripping. Never extract codes from Description.',
  20
);
```

## Rule Priority Guidelines

**Recommended priority values:**

- `1-10`: Critical OCR corrections (must run first)
- `11-20`: Prefix/suffix transformations
- `21-30`: Code location overrides
- `31-40`: Description splitting rules
- `41+`: Customer-specific edge cases

## Testing New Rules

1. Add rule to database via Prisma Studio or SQL
2. Upload a test PO for that customer
3. Check the logs for: `📋 Loaded X PO rules from database`
4. Verify the extracted data matches expected format

## Fallback Behavior

If database fetch fails or returns no rules:
- System automatically falls back to base prompt template
- Logs: `📋 No PO rules in database, using base prompt`
- **No errors thrown** - graceful degradation

## Future Enhancements

- [ ] UI for managing rules (CRUD operations)
- [ ] Rule testing/preview mode
- [ ] Rule versioning/audit log
- [ ] Per-customer rule enable/disable toggle
- [ ] Rule analytics (which rules are being triggered)

## API Reference

### Get All Rules
```typescript
GET /api/poRules
// Returns: IPoRule[]
```

### Build Dynamic Prompt (Internal)
```typescript
import { buildPOScanPrompt } from "@/lib/prompt-builder";

const prompt = await buildPOScanPrompt();
// Returns: string (complete prompt with injected rules)
```

## Migration Checklist

- [x] Create `PoRule` table in database
- [x] Build prompt builder function
- [x] Update scan-po route to use dynamic prompts
- [x] Add fallback to base template
- [x] Test with existing POs
- [ ] Migrate existing XML rules to database
- [ ] Build UI for rule management
- [ ] Remove hardcoded rules from XML (after testing)
