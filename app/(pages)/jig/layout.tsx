import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("jig");

export default function JIGLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
