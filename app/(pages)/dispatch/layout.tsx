import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("dispatch");

export default function DispatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
