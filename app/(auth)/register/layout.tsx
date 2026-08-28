import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("register");

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
