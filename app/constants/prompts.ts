import { readFileSync } from 'fs';
import { join } from 'path';

// Load the PO scan prompt from Markdown file
const promptMd = readFileSync(
  join(process.cwd(), 'app/constants/po-scan-prompt.md'),
  'utf-8'
);

export const PO_SCAN_SYSTEM_PROMPT = promptMd;
