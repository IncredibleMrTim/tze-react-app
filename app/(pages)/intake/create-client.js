const fs = require('fs');

// Read the old page
const oldContent = fs.readFileSync('page.tsx', 'utf8');

// Transform it
let newContent = oldContent;

// Replace imports
newContent = newContent.replace(
  'import { useState, useRef } from "react";',
  'import { useState, useRef, useTransition } from "react";'
);

newContent = newContent.replace(
  'import { useStore } from "@/store/useStore";',
  'import { createJobAction, updateJobAction, deleteJobAction } from "@/actions/jobs";\nimport { useToast } from "@/hooks/useToast";'
);

// Change component signature
newContent = newContent.replace(
  'export default function IntakePage() {',
  `interface IntakeClientProps {
  initialJobs: IJob[];
  initialJigAssignments: IJigAssignment[];
  items: IItem[];
  contacts: IContact[];
}

export default function IntakeClient({
  initialJobs,
  initialJigAssignments,
  items: ITEMS,
  contacts: CONTACTS,
}: IntakeClientProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  
  // Local state (optimistic)
  const [jobs, setJobs] = useState(initialJobs);
  const jigAssignments = initialJigAssignments;`
);

// Remove Zustand store calls
newContent = newContent.replace(/const jobs = useStore\(\(state\) => state\.jobs\);/g, '');
newContent = newContent.replace(/const jigAssignments = useStore\(\(state\) => state\.jigAssignments\);/g, '');
newContent = newContent.replace(/const handleSaveJob = useStore\(\(state\) => state\.handleSaveJob\);/g, '');
newContent = newContent.replace(/const handleUpdateJob = useStore\(\(state\) => state\.handleUpdateJob\);/g, '');
newContent = newContent.replace(/const handleDeleteJob = useStore\(\(state\) => state\.handleDeleteJob\);/g, '');
newContent = newContent.replace(/const showToast = useStore\(\(state\) => state\.showToast\);/g, '');
newContent = newContent.replace(/const ITEMS = useStore\(\(state\) => state\.items\);/g, '');
newContent = newContent.replace(/const CONTACTS = useStore\(\(state\) => state\.contacts\);/g, '');

// Add IJigAssignment to imports
newContent = newContent.replace(
  'import type { IJob, IContact, IPart, IItem } from "@/types/interfaces";',
  'import type { IJob, IContact, IPart, IItem, IJigAssignment } from "@/types/interfaces";'
);

// Write the new file
fs.writeFileSync('IntakeClient-generated.tsx', newContent);

console.log('✅ Generated IntakeClient-generated.tsx');
