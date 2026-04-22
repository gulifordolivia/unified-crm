import { ArrowRight, Building2, House, Layers3, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { formatShortDate } from "@/lib/dates";
import { formatCurrency, formatWholeNumber, loadCrmSnapshot } from "@/lib/lead-utils";

export default async function HomePage() {
  const snapshot = await loadCrmSnapshot();

  const stats = [
    {
      label: "Active agent leads",
      value: formatWholeNumber(snapshot.agent.totalLeads),
      detail: `${snapshot.agent.hotLeads} hot leads and ${snapshot.agent.overdueFollowUps} overdue follow-ups`,
    },
    {
      label: "Preforeclosure pipeline",
      value: formatWholeNumber(snapshot.preforeclosure.totalLeads),
      detail: `${snapshot.preforeclosure.highDistressCount} high-distress owners and ${snapshot.preforeclosure.auctionsThisWeek} auction dates this week`,
    },
    {
      label: "Pipeline value",
      value: formatCurrency(snapshot.agent.pipelineValue + snapshot.preforeclosure.estimatedOpportunityValue),
      detail: "Combined projected revenue and opportunity value across both teams",
    },
  ];

  const alerts = [
    `${snapshot.duplicateGroups.length} duplicate groups need review before routing outreach.`,
    `${snapshot.agent.overdueFollowUps} agent follow-ups and ${snapshot.preforeclosure.auctionsThisWeek} auction deadlines need immediate attention.`,
  ];

  return (
    <AppShell
      mode="overview"
      dataSource={snapshot.dataSource}
      title="Unified CRM command center"
      description="Switch between Agent CRM and Preforeclosure CRM, monitor live readiness, and keep operators focused on the next best action."
      stats={stats}
      alerts={alerts}
    >
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-teal)]">
                Operating picture
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-sand)]">
                Today&apos;s highest-value lanes
              </h2>
            </div>
            <span className="rounded-full border border-[var(--color-line)] bg-white/5 px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
              Refreshed {formatShortDate(new Date().toISOString())}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/agents"
              className="rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(110,231,216,0.08)] p-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 text-[var(--color-sand)]">
                <Building2 className="h-5 w-5 text-[var(--color-teal)]" />
                <span className="font-semibold">Agent CRM</span>
              </div>
              <p className="mt-4 text-sm text-[var(--color-copy)]">
                {snapshot.agent.hotLeads} hot buyer and seller leads are actively being worked.
              </p>
              <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-muted)]">
                <span>{formatCurrency(snapshot.agent.pipelineValue)} in pipeline</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>

            <Link
              href="/preforeclosures"
              className="rounded-[1.5rem] border border-[var(--color-line)] bg-[rgba(247,191,99,0.08)] p-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 text-[var(--color-sand)]">
                <House className="h-5 w-5 text-[var(--color-gold)]" />
                <span className="font-semibold">Preforeclosure CRM</span>
              </div>
              <p className="mt-4 text-sm text-[var(--color-copy)]">
                {snapshot.preforeclosure.highDistressCount} homeowners are in the highest-distress segment.
              </p>
              <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-muted)]">
                <span>{snapshot.preforeclosure.auctionsThisWeek} auction windows this week</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-3 text-[var(--color-sand)]">
            <Sparkles className="h-5 w-5 text-[var(--color-sky)]" />
            <h2 className="text-lg font-semibold">Operator priorities</h2>
          </div>
          <div className="mt-5 space-y-4">
            {snapshot.priorityQueue.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.4rem] border border-[var(--color-line)] bg-black/10 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[var(--color-sand)]">{item.name}</p>
                  <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
                    {item.mode === "agent" ? "Agent" : "Preforeclosure"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-copy)]">{item.summary}</p>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  <span>{item.nextActionLabel}</span>
                  <span>Score {item.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Layers3 className="h-5 w-5 text-[var(--color-lime)]" />
            <h2 className="text-lg font-semibold text-[var(--color-sand)]">Data health</h2>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.duplicateGroups.map((group, index) => (
              <div
                key={`${group.matchKey}-${index}`}
                className="rounded-[1.3rem] border border-[var(--color-line)] bg-white/4 p-4"
              >
                <p className="text-sm font-medium text-[var(--color-sand)]">
                  Possible duplicate on {group.matchField}
                </p>
                <p className="mt-1 text-sm text-[var(--color-copy)]">
                  {group.items.map((item) => item.name).join(" / ")}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  {group.matchKey}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-sand)]">Recent movement</h2>
          <div className="mt-5 grid gap-3">
            {snapshot.recentActivity.map((item) => (
              <div
                key={`${item.name}-${item.action}`}
                className="flex flex-col gap-3 rounded-[1.4rem] border border-[var(--color-line)] bg-white/4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[var(--color-sand)]">{item.name}</p>
                  <p className="mt-1 text-sm text-[var(--color-copy)]">{item.action}</p>
                </div>
                <p className="text-sm text-[var(--color-muted)]">{item.when}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
