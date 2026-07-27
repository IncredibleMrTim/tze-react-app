import type { Metadata } from "next";

type PageMetadata = {
  title: string;
  description: string;
};

const pageMetadata: Record<string, PageMetadata> = {
  intake: {
    title: "Intake",
    description: "Job intake, search, and management",
  },
  dispatch: {
    title: "Dispatch",
    description: "Dispatch jobs and generate invoices",
  },
  jig: {
    title: "JIG Management",
    description: "Manage JIG assignments and completion",
  },
  settings: {
    title: "Settings",
    description: "Configure application settings and rates",
  },
};

export function createPageMetadata(page: keyof typeof pageMetadata): Metadata {
  const { title, description } = pageMetadata[page];
  return {
    title: `${title} | TZE`,
    description,
  };
}
