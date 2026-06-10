import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("intake");

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
