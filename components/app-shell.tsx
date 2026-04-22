import { BellDot, DatabaseZap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ModeSwitch } from "@/components/mode-switch";
import type { DashboardMode, DataSource } from "@/lib/lead-utils";

type AppShellProps = {
  mode: DashboardMode;
  dataSource: DataSource;
  title: string;
  description: string;
  stats: {
    label: string;
    value: string;
    detail: string;
  }[];
  alerts: string[];
  children: ReactNode;
};

const modeAccent: Record<DashboardMode, string> = {
  overview: "var(--color-sky)",
  agent: "var(--color-teal)",
  preforeclosure: "var(--color-gold)",
};

export function AppShell({
  mode,
  dataSource,
  title,
  description,
  stats,
  alerts,
  children,
}: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="glass-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${modeAccent[mode]}, transparent)`,
          }}
        />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/4 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-muted)]"
              >
                <span
                  className="status-dot"
                  style={{
                    backgroundColor:
                      dataSource === "live" ? "var(--color-lime)" : "var(--color-gold)",
                  }}
                />
                Unified CRM
              </Link>
              <h1 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-[var(--color-sand)] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-copy)] sm:text-base">
                {description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <ModeSwitch mode={mode} />
              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-[var(--color-line)] bg-black/15 px-3 py-1.5 text-xs font-medium text-[var(--color-muted)]">
                  {dataSource === "live" ? "Supabase connected" : "Demo data fallback"}
                </div>
                <div className="rounded-full border border-[var(--color-line)] bg-black/15 px-3 py-1.5 text-xs font-medium text-[var(--color-muted)]">
                  Mobile-first dashboard
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-[var(--color-line)] bg-black/10 p-4"
              >
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-muted)]">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--color-sand)]">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-copy)]">{stat.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-black/10 p-4">
              <div className="flex items-center gap-2 text-[var(--color-sand)]">
                <BellDot className="h-4 w-4 text-[var(--color-rose)]" />
                <p className="font-medium">Watch list</p>
              </div>
              <div className="mt-4 grid gap-2">
                {alerts.map((alert) => (
                  <div
                    key={alert}
                    className="rounded-[1rem] border border-[var(--color-line)] bg-white/4 px-3 py-2 text-sm text-[var(--color-copy)]"
                  >
                    {alert}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[var(--color-sand)]">
                  <DatabaseZap className="h-4 w-4 text-[var(--color-sky)]" />
                  <p className="font-medium">Data posture</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-copy)]">
                  The dashboard automatically uses Supabase when credentials are present and falls
                  back to curated demo records otherwise.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[var(--color-sand)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--color-lime)]" />
                  <p className="font-medium">Ops posture</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-copy)]">
                  Shared scoring, duplicate detection, and urgency queues keep both operating modes
                  aligned without splitting the product into separate apps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 pb-8">{children}</div>
    </main>
  );
}
