import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("settings");

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
