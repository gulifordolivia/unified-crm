import { CalendarClock, DollarSign, Funnel, MessageSquareMore, UserRoundSearch } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { formatShortDate } from "@/lib/dates";
import { formatCurrency, formatWholeNumber, loadCrmSnapshot } from "@/lib/lead-utils";

export default async function AgentsPage() {
  const snapshot = await loadCrmSnapshot();

  const stats = [
    {
      label: "Active leads",
      value: formatWholeNumber(snapshot.agent.totalLeads),
      detail: `${snapshot.agent.newThisWeek} added this week`,
    },
    {
      label: "Hot leads",
      value: formatWholeNumber(snapshot.agent.hotLeads),
      detail: `${snapshot.agent.overdueFollowUps} overdue follow-ups`,
    },
    {
      label: "Pipeline value",
      value: formatCurrency(snapshot.agent.pipelineValue),
      detail: "Modeled from budget-qualified leads",
    },
  ];

  return (
    <AppShell
      mode="agent"
      dataSource={snapshot.dataSource}
      title="Agent CRM"
      description="Give agents one place to triage inbound leads, protect response time, and keep every hot contact moving."
      stats={stats}
      alerts={[
        `${snapshot.agent.overdueFollowUps} leads are overdue for a follow-up touch.`,
        `${snapshot.agent.hotLeads} leads have a score of 80+ and should stay in the same-day call block.`,
      ]}
    >
      <section className="grid gap-4 lg:grid-cols-[1.06fr_0.94fr]">
        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Funnel className="h-5 w-5 text-[var(--color-teal)]" />
            <h2 className="text-lg font-semibold text-[var(--color-sand)]">Lead funnel</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {snapshot.agent.stageCards.map((card) => (
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
            <CalendarClock className="h-5 w-5 text-[var(--color-gold)]" />
            <h2 className="text-lg font-semibold text-[var(--color-sand)]">Next action queue</h2>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.agent.followUpQueue.map((lead) => (
              <div
                key={lead.id}
                className="rounded-[1.4rem] border border-[var(--color-line)] bg-black/10 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[var(--color-sand)]">{lead.name}</p>
                  <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
                    Score {lead.score}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-copy)]">
                  {lead.stage} lead from {lead.source}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm text-[var(--color-muted)]">
                  <span>Next touch {formatShortDate(lead.nextActionAt)}</span>
                  <span>{formatCurrency(lead.budget)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.04fr_0.96fr]">
        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <UserRoundSearch className="h-5 w-5 text-[var(--color-sky)]" />
            <h2 className="text-lg font-semibold text-[var(--color-sand)]">Top opportunities</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {snapshot.agent.topLeads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-[1.4rem] border border-[var(--color-line)] bg-white/4 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--color-sand)]">{lead.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-copy)]">{lead.city}</p>
                  </div>
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-muted)]">
                    {lead.intent}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lead.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[rgba(125,211,252,0.09)] px-2.5 py-1 text-xs text-[var(--color-sky)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-[var(--color-lime)]" />
              <h2 className="text-lg font-semibold text-[var(--color-sand)]">Response metrics</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {snapshot.agent.metrics.map((metric) => (
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

          <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <MessageSquareMore className="h-5 w-5 text-[var(--color-rose)]" />
              <h2 className="text-lg font-semibold text-[var(--color-sand)]">Agent notes</h2>
            </div>
            <div className="mt-5 space-y-3">
              {snapshot.agent.notes.map((note) => (
                <div
                  key={`${note.author}-${note.title}`}
                  className="rounded-[1.3rem] border border-[var(--color-line)] bg-black/10 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-[var(--color-sand)]">{note.title}</p>
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      {note.author}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-copy)]">{note.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
