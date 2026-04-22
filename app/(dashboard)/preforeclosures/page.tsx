import { AlertTriangle, BadgeDollarSign, Clock3, Home, Workflow } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { formatShortDate } from "@/lib/dates";
import { formatCurrency, formatWholeNumber, loadCrmSnapshot } from "@/lib/lead-utils";

export default async function PreforeclosuresPage() {
  const snapshot = await loadCrmSnapshot();

  const stats = [
    {
      label: "Tracked owners",
      value: formatWholeNumber(snapshot.preforeclosure.totalLeads),
      detail: `${snapshot.preforeclosure.newThisWeek} fresh filings this week`,
    },
    {
      label: "High distress",
      value: formatWholeNumber(snapshot.preforeclosure.highDistressCount),
      detail: `${snapshot.preforeclosure.auctionsThisWeek} auction windows this week`,
    },
    {
      label: "Opportunity value",
      value: formatCurrency(snapshot.preforeclosure.estimatedOpportunityValue),
      detail: "Estimated from equity and fee model assumptions",
    },
  ];

  return (
    <AppShell
      mode="preforeclosure"
      dataSource={snapshot.dataSource}
      title="Preforeclosure CRM"
      description="Track legal urgency, data quality, and homeowner outreach from first filing through workout or acquisition."
      stats={stats}
      alerts={[
        `${snapshot.preforeclosure.auctionsThisWeek} records have auction dates in the next seven days.`,
        `${snapshot.duplicateGroups.length} records need duplicate review before campaign sequencing.`,
      ]}
    >
      <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Workflow className="h-5 w-5 text-[var(--color-gold)]" />
            <h2 className="text-lg font-semibold text-[var(--color-sand)]">Distress pipeline</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {snapshot.preforeclosure.stageCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[1.4rem] border border-[var(--color-line)] bg-white/4 p-4"
              >
                <p className="text-sm text-[var(--color-muted)]">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-sand)]">{card.value}</p>
                <p className="mt-2 text-sm text-[var(--color-copy)]">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[var(--color-rose)]" />
            <h2 className="text-lg font-semibold text-[var(--color-sand)]">Urgency queue</h2>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.preforeclosure.urgencyQueue.map((lead) => (
              <div
                key={lead.id}
                className="rounded-[1.4rem] border border-[var(--color-line)] bg-black/10 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[var(--color-sand)]">{lead.ownerName}</p>
                  <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
                    Score {lead.score}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-copy)]">
                  {lead.propertyAddress}, {lead.city}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm text-[var(--color-muted)]">
                  <span>Auction {formatShortDate(lead.auctionDate)}</span>
                  <span>{lead.distressLevel} distress</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.98fr_1.02fr]">
        <div className="grid gap-4">
          <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[var(--color-sky)]" />
              <h2 className="text-lg font-semibold text-[var(--color-sand)]">Duplicate review</h2>
            </div>
            <div className="mt-5 space-y-3">
              {snapshot.duplicateGroups.map((group, index) => (
                <div
                  key={`${group.matchField}-${index}`}
                  className="rounded-[1.3rem] border border-[var(--color-line)] bg-white/4 p-4"
                >
                  <p className="font-medium text-[var(--color-sand)]">{group.matchField}</p>
                  <p className="mt-2 text-sm text-[var(--color-copy)]">
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
            <div className="flex items-center gap-3">
              <BadgeDollarSign className="h-5 w-5 text-[var(--color-lime)]" />
              <h2 className="text-lg font-semibold text-[var(--color-sand)]">Value drivers</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {snapshot.preforeclosure.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.3rem] border border-[var(--color-line)] bg-white/4 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-sand)]">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-copy)]">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5 text-[var(--color-gold)]" />
            <h2 className="text-lg font-semibold text-[var(--color-sand)]">Outreach roster</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {snapshot.preforeclosure.outreachRoster.map((lead) => (
              <div
                key={lead.id}
                className="rounded-[1.4rem] border border-[var(--color-line)] bg-black/10 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--color-sand)]">{lead.ownerName}</p>
                    <p className="mt-1 text-sm text-[var(--color-copy)]">{lead.assignedTo}</p>
                  </div>
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-muted)]">
                    {formatCurrency(lead.estimatedEquity)}
                  </span>
                </div>
                <p className="mt-4 text-sm text-[var(--color-copy)]">
                  {lead.propertyAddress}, {lead.city}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm text-[var(--color-muted)]">
                  <span>Filed {formatShortDate(lead.filingDate)}</span>
                  <span>{lead.outreachStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
