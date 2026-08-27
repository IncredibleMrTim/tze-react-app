import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("sign-in");

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
