# Claude Code Guidelines for TZE React App

## Project Overview

This is a Next.js 16 manufacturing management app for TGA Electroplaters, handling job intake, PO scanning with Claude AI, inventory matching, and job tracking.

## TypeScript Standards

### Type Safety

- **NEVER use `any` type** - Always use proper types or `unknown` if truly needed
- Use strict TypeScript settings - no implicit any, strict null checks
- Prefer interfaces from `@/types/interfaces` over inline types
- Use type inference where obvious, explicit types where clarity helps

### Examples

```typescript
// ❌ BAD
function processData(data: any) {
  return data.map((x: any) => x.value);
}

// ✅ GOOD
function processData(data: IItem[]): number[] {
  return data.map((item) => item.price);
}
```

## Naming Conventions

### Variables & Functions

- Use **descriptive, meaningful names** - no abbreviations unless universally known
- Functions: `verbNoun` format (e.g., `scanPODocument`, `matchScannedParts`)
- Boolean variables: prefix with `is`, `has`, `should` (e.g., `isLoading`, `hasError`)
- Constants: `SCREAMING_SNAKE_CASE` for true constants
- State variables: describe what they hold (e.g., `customerInput` not `input`)

### Examples

```typescript
// ❌ BAD
const d = await getData();
const flg = true;
const x = items.filter(i => i.p > 0);

// ✅ GOOD
const contacts = await getContacts();
const isScanning = true;
const itemsWithPrice = items.filter(item => item.price > 0);
```

## Code Style

### Functions

- Keep functions small and focused (single responsibility)
- Max 50 lines per function - extract helpers if longer
- Prefer pure functions where possible
- Always add JSDoc comments for exported functions

### React Components

- Use functional components with hooks
- Keep component files under 300 lines
- Extract complex logic to custom hooks or utility functions
- Props interface should be named `[ComponentName]Props`

### Server Actions

- Always use `"use server"` directive at top of file
- Name files with pattern `[action-name].ts` in `app/actions/`
- Never log sensitive data (API keys, passwords, **base64 images**)
- Load data from database, not from empty constants

### Comments

- Write comments for **WHY**, not **WHAT**
- Document business logic and non-obvious decisions
- No commented-out code in commits - use git history instead
- Add TODO comments with ticket numbers: `// TODO(TZE-123): Fix this`

## Database & Data Loading

### Critical Rules

- **NEVER use empty arrays from helpers.ts** (e.g., `ITEMS`, `CONTACTS`)
- Always load data from database using functions in `@/lib/db`
- Pass data as function parameters, not module-level imports
- Use Prisma client for all database operations

### Examples

```typescript
// ❌ BAD - using empty array
import { ITEMS } from "@/lib/helpers";
const item = ITEMS.find(x => x.code === code);

// ✅ GOOD - load from database
import { getItems } from "@/lib/db";
const items = await getItems();
const item = items.find(x => x.code === code);
```

## Error Handling

- Always handle errors explicitly - no silent failures
- Use try-catch for async operations that might fail
- Provide helpful error messages to users via toast notifications
- Log errors with context: `console.error("Context:", error)`
- Never expose internal errors to users (sanitize messages)

## Security

- Never log sensitive data (passwords, tokens, **base64 images**, API keys)
- Validate user input at boundaries (forms, API routes)
- Use environment variables for secrets (`.env.local`)
- Sanitize data before logging (see `scan-po.ts` for base64 handling)

## Git Workflow

### Commits

- Follow conventional commits: `type(scope): description`
- Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`
- Keep commits atomic and focused
- Reference ticket numbers in commit body if applicable

### Branches

- Format: `type/TZE-###-description` (e.g., `fix/TZE-29-items-empty`)
- Types match commit types
- Always branch from `main`
- Delete branches after merging

## Project-Specific Rules

### PO Scanning

- Multi-page support required - always handle `base64DataArray` as array
- Never log base64 data (framework logs function arguments)
- Match parts to inventory using `matchScannedParts` with items from DB
- Always resolve customer using `resolveCustomer` helper

### Inventory Matching

- Try matching strategies in order: exact → ticker → substring → fuzzy → description
- Respect customer restrictions on items
- Fallback to "ZINC MISCELLANEOUS" if no match found
- Always preserve scanned data (code, description, quantity)

### Job Management

- Jobs are the core entity - PO number must be unique
- Jobs have states: Intake → WIP (on jig) → Ready → Dispatched
- Use server actions for all mutations (create, update, delete)
- Optimistic updates with rollback on error

## File Organization

```
app/
  actions/          # Server actions (use server directive)
  (pages)/          # Route groups for pages
  lib/              # Utilities, helpers, DB client
  constants/        # Constants, prompts, settings
  types/            # TypeScript interfaces and types
  components/       # React components
    ui/             # Shadcn UI components
```

## Performance

- Use React Server Components where possible
- Minimize client-side JavaScript
- Load data in parallel when independent
- Avoid unnecessary re-renders (memoization only when measured)

## Testing

- Test critical paths: PO scanning, inventory matching, job creation
- Mock external services (Claude API, database)
- Integration tests over unit tests
- No tests blocking commits (test script not required)

## Dependencies

- Next.js 16+ (App Router)
- React 19+
- TypeScript 6+
- Prisma (PostgreSQL)
- Anthropic SDK (Claude API)
- Shadcn UI components

## Questions?

If unsure about:

- Database schema → Check `prisma/schema.prisma`
- Type definitions → Check `app/types/interfaces.ts`
- UI components → Check `app/components/ui/`
- Server actions → Check `app/actions/`
