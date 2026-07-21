"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIntakeStore } from "./store/useIntakeStore";

export function Navigation() {
  const pathname = usePathname();
  const { setCurrentJob } = useIntakeStore();

  const navItems = [
    { href: "/jobs", icon: "🔍", label: "Search" },
    { href: "/intake", icon: "📥", label: "Jobs" },
    { href: "/jig", icon: "⚙️", label: "JIG" },
    { href: "/dispatch", icon: "🚚", label: "Dispatch" },
    { href: "/settings", icon: "🔧", label: "Settings" },
  ];

  return (
    <nav className="flex border-t border-gray-200 bg-white flex-shrink-0">
      {navItems.map(({ href, icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setCurrentJob(null)}
            className={`flex-1 px-1 py-2.5 flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer text-[10px] font-medium border-t-2 transition-colors ${
              isActive
                ? "text-primary border-t-primary"
                : "text-gray-500 border-t-transparent"
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
