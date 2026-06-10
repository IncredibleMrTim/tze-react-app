import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("jobs");

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
