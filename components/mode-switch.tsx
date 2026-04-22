"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardMode } from "@/lib/lead-utils";

const tabs: { href: string; label: string; mode: DashboardMode }[] = [
  { href: "/agents", label: "Agent CRM", mode: "agent" },
  { href: "/preforeclosures", label: "Preforeclosure CRM", mode: "preforeclosure" },
];

export function ModeSwitch({ mode }: { mode: DashboardMode }) {
  const pathname = usePathname();

  return (
    <div className="rounded-full border border-[var(--color-line)] bg-black/20 p-1.5">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href || (mode !== "overview" && mode === tab.mode);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-sand)] text-[var(--color-ink)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-sand)]",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
