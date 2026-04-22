import { daysUntil, formatRelativeWindow, isWithinDays } from "@/lib/dates";
import { type DuplicateCandidate, findDuplicateGroups } from "@/lib/duplicate-utils";
import { scoreAgentLead, scorePreforeclosureLead, scoreToPriority } from "@/lib/scoring";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type DashboardMode = "overview" | "agent" | "preforeclosure";
export type DataSource = "demo" | "live";

export type AgentLead = {
  id: string;
  name: string;
  city: string;
  source: string;
  intent: "Buyer" | "Seller" | "Investor";
  stage: "New" | "Qualified" | "Touring" | "Negotiating" | "Nurture";
  budget: number;
  lastContactedAt: string;
  nextActionAt: string;
  email: string;
  phone: string;
  tags: string[];
  score: number;
  priority: string;
};

export type PreforeclosureLead = {
  id: string;
  ownerName: string;
  propertyAddress: string;
  city: string;
  filingDate: string;
  auctionDate: string;
  distressLevel: "Moderate" | "High" | "Critical";
  outreachStatus:
    | "New Filing"
    | "Needs Skip Trace"
    | "Direct Mail Sent"
    | "Call Attempted"
    | "Under Review";
  assignedTo: string;
  amountOwed: number;
  estimatedEquity: number;
  score: number;
  priority: string;
};

type MetricCard = {
  label: string;
  value: string;
  detail: string;
};

type UnifiedPriorityItem = {
  id: string;
  mode: "agent" | "preforeclosure";
  name: string;
  summary: string;
  nextActionLabel: string;
  score: number;
};

type RecentActivityItem = {
  name: string;
  action: string;
  when: string;
};

export type CrmSnapshot = {
  dataSource: DataSource;
  agent: {
    totalLeads: number;
    hotLeads: number;
    overdueFollowUps: number;
    newThisWeek: number;
    pipelineValue: number;
    topLeads: AgentLead[];
    followUpQueue: AgentLead[];
    stageCards: MetricCard[];
    metrics: MetricCard[];
    notes: { title: string; body: string; author: string }[];
  };
  preforeclosure: {
    totalLeads: number;
    highDistressCount: number;
    auctionsThisWeek: number;
    newThisWeek: number;
    estimatedOpportunityValue: number;
    urgencyQueue: PreforeclosureLead[];
    outreachRoster: PreforeclosureLead[];
    stageCards: MetricCard[];
    metrics: MetricCard[];
  };
  duplicateGroups: ReturnType<typeof findDuplicateGroups>;
  priorityQueue: UnifiedPriorityItem[];
  recentActivity: RecentActivityItem[];
};

const mockAgentLeads = [
  {
    id: "agent-1",
    name: "Maya Rodriguez",
    city: "Detroit, MI",
    source: "Facebook seller form",
    intent: "Seller" as const,
    stage: "Negotiating" as const,
    budget: 640000,
    lastContactedAt: "2026-04-21T14:00:00.000Z",
    nextActionAt: "2026-04-23T14:00:00.000Z",
    email: "maya@rivernorth.com",
    phone: "313-555-0163",
    tags: ["High equity", "Listing signed soon"],
  },
  {
    id: "agent-2",
    name: "Noah Bennett",
    city: "Ann Arbor, MI",
    source: "Zillow Flex",
    intent: "Buyer" as const,
    stage: "Touring" as const,
    budget: 510000,
    lastContactedAt: "2026-04-19T13:00:00.000Z",
    nextActionAt: "2026-04-22T18:00:00.000Z",
    email: "noah.bennett@example.com",
    phone: "734-555-0118",
    tags: ["VA loan", "Weekend showings"],
  },
  {
    id: "agent-3",
    name: "Jordan Lee",
    city: "Royal Oak, MI",
    source: "Sphere referral",
    intent: "Investor" as const,
    stage: "Qualified" as const,
    budget: 420000,
    lastContactedAt: "2026-04-16T09:30:00.000Z",
    nextActionAt: "2026-04-21T16:00:00.000Z",
    email: "jordan.lee@example.com",
    phone: "248-555-0147",
    tags: ["Cash", "Needs duplex inventory"],
  },
  {
    id: "agent-4",
    name: "Sophie Carter",
    city: "Birmingham, MI",
    source: "Google PPC",
    intent: "Buyer" as const,
    stage: "New" as const,
    budget: 795000,
    lastContactedAt: "2026-04-22T09:00:00.000Z",
    nextActionAt: "2026-04-22T20:00:00.000Z",
    email: "sophie.carter@example.com",
    phone: "248-555-0125",
    tags: ["Luxury search", "Relocating in 45 days"],
  },
];

const mockPreforeclosureLeads = [
  {
    id: "pf-1",
    ownerName: "Teresa Jackson",
    propertyAddress: "1452 Glendale Ave",
    city: "Detroit, MI",
    filingDate: "2026-04-11T13:00:00.000Z",
    auctionDate: "2026-04-27T15:00:00.000Z",
    distressLevel: "Critical" as const,
    outreachStatus: "Call Attempted" as const,
    assignedTo: "Marcus Hill",
    amountOwed: 182000,
    estimatedEquity: 96000,
  },
  {
    id: "pf-2",
    ownerName: "Eleanor Davis",
    propertyAddress: "88 W Columbia St",
    city: "Pontiac, MI",
    filingDate: "2026-04-18T11:30:00.000Z",
    auctionDate: "2026-05-05T15:00:00.000Z",
    distressLevel: "High" as const,
    outreachStatus: "Needs Skip Trace" as const,
    assignedTo: "Ari Patel",
    amountOwed: 124000,
    estimatedEquity: 73000,
  },
  {
    id: "pf-3",
    ownerName: "Michael Greene",
    propertyAddress: "1452 Glendale Ave",
    city: "Detroit, MI",
    filingDate: "2026-04-12T09:00:00.000Z",
    auctionDate: "2026-04-28T15:00:00.000Z",
    distressLevel: "High" as const,
    outreachStatus: "Direct Mail Sent" as const,
    assignedTo: "Marcus Hill",
    amountOwed: 188000,
    estimatedEquity: 91000,
  },
  {
    id: "pf-4",
    ownerName: "Jasmine Flores",
    propertyAddress: "640 Marquette Dr",
    city: "Southfield, MI",
    filingDate: "2026-04-20T15:30:00.000Z",
    auctionDate: "2026-05-09T15:00:00.000Z",
    distressLevel: "Moderate" as const,
    outreachStatus: "New Filing" as const,
    assignedTo: "Troy Barnes",
    amountOwed: 202000,
    estimatedEquity: 118000,
  },
];

function enrichAgentLead(
  lead: Omit<AgentLead, "score" | "priority">,
): AgentLead {
  const score = scoreAgentLead({
    budget: lead.budget,
    intent: lead.intent,
    lastContactedAt: lead.lastContactedAt,
    nextActionAt: lead.nextActionAt,
    stage: lead.stage,
  });

  return { ...lead, score, priority: scoreToPriority(score) };
}

function enrichPreforeclosureLead(
  lead: Omit<PreforeclosureLead, "score" | "priority">,
): PreforeclosureLead {
  const score = scorePreforeclosureLead({
    distressLevel: lead.distressLevel,
    filingDate: lead.filingDate,
    auctionDate: lead.auctionDate,
    estimatedEquity: lead.estimatedEquity,
    outreachStatus: lead.outreachStatus,
  });

  return { ...lead, score, priority: scoreToPriority(score) };
}

function coerceString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function coerceNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function buildSnapshot(
  agentLeads: AgentLead[],
  preforeclosureLeads: PreforeclosureLead[],
  dataSource: DataSource,
): CrmSnapshot {
  const duplicateCandidates: DuplicateCandidate[] = [
    ...agentLeads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
    })),
    ...preforeclosureLeads.map((lead) => ({
      id: lead.id,
      name: lead.ownerName,
      address: lead.propertyAddress,
    })),
  ];

  const duplicateGroups = findDuplicateGroups(duplicateCandidates);
  const hotAgentLeads = agentLeads.filter((lead) => lead.score >= 80);
  const overdueFollowUps = agentLeads.filter((lead) => daysUntil(lead.nextActionAt) < 0).length;
  const highDistressCount = preforeclosureLeads.filter(
    (lead) => lead.distressLevel !== "Moderate",
  ).length;
  const auctionsThisWeek = preforeclosureLeads.filter((lead) =>
    isWithinDays(lead.auctionDate, 7),
  ).length;

  return {
    dataSource,
    agent: {
      totalLeads: agentLeads.length,
      hotLeads: hotAgentLeads.length,
      overdueFollowUps,
      newThisWeek: agentLeads.filter((lead) => isWithinDays(lead.lastContactedAt, 7)).length,
      pipelineValue: agentLeads.reduce((sum, lead) => sum + lead.budget, 0),
      topLeads: [...agentLeads].sort((a, b) => b.score - a.score).slice(0, 3),
      followUpQueue: [...agentLeads]
        .sort((a, b) => new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime())
        .slice(0, 4),
      stageCards: [
        {
          label: "Qualified + touring",
          value: formatWholeNumber(
            agentLeads.filter((lead) => ["Qualified", "Touring"].includes(lead.stage)).length,
          ),
          detail: "Mid-funnel leads who should stay inside the daily speed-to-lead workflow.",
        },
        {
          label: "Negotiating",
          value: formatWholeNumber(
            agentLeads.filter((lead) => lead.stage === "Negotiating").length,
          ),
          detail: "Revenue-near opportunities that need close supervision.",
        },
        {
          label: "Seller intent",
          value: formatWholeNumber(
            agentLeads.filter((lead) => lead.intent === "Seller").length,
          ),
          detail: "Potential listing inventory worth immediate outbound attention.",
        },
        {
          label: "Average score",
          value: formatWholeNumber(
            Math.round(
              agentLeads.reduce((sum, lead) => sum + lead.score, 0) / agentLeads.length,
            ),
          ),
          detail: "Composite urgency blending value, recency, and next-action timing.",
        },
      ],
      metrics: [
        {
          label: "Median budget",
          value: formatCurrency(
            Math.round(
              [...agentLeads]
                .sort((a, b) => a.budget - b.budget)
                [Math.floor(agentLeads.length / 2)]?.budget ?? 0,
            ),
          ),
          detail: "Good benchmark for routing premium inventory and ad spend.",
        },
        {
          label: "Same-day touches",
          value: formatWholeNumber(agentLeads.filter((lead) => daysUntil(lead.nextActionAt) <= 0).length),
          detail: "Leads due today or already overdue for outreach.",
        },
        {
          label: "High-intent mix",
          value: `${Math.round((hotAgentLeads.length / agentLeads.length) * 100)}%`,
          detail: "Share of leads sitting in the hot score band.",
        },
      ],
      notes: [
        {
          title: "Luxury inbound volume is climbing",
          body: "Google PPC traffic is sending better-qualified buyer traffic than referral sources this week. Keep premium inventory alerts active.",
          author: "Revenue ops",
        },
        {
          title: "Sphere follow-up gap",
          body: "Referral leads are aging out faster than paid leads. Tighten same-day text + call automation for sphere submissions.",
          author: "Lead manager",
        },
      ],
    },
    preforeclosure: {
      totalLeads: preforeclosureLeads.length,
      highDistressCount,
      auctionsThisWeek,
      newThisWeek: preforeclosureLeads.filter((lead) => isWithinDays(lead.filingDate, 7)).length,
      estimatedOpportunityValue: Math.round(
        preforeclosureLeads.reduce((sum, lead) => sum + lead.estimatedEquity * 0.18, 0),
      ),
      urgencyQueue: [...preforeclosureLeads]
        .sort((a, b) => b.score - a.score)
        .slice(0, 4),
      outreachRoster: [...preforeclosureLeads]
        .sort(
          (a, b) =>
            new Date(a.filingDate).getTime() - new Date(b.filingDate).getTime(),
        )
        .slice(0, 4),
      stageCards: [
        {
          label: "Critical distress",
          value: formatWholeNumber(
            preforeclosureLeads.filter((lead) => lead.distressLevel === "Critical").length,
          ),
          detail: "Highest-risk owners where timeline compression is most severe.",
        },
        {
          label: "Needs tracing",
          value: formatWholeNumber(
            preforeclosureLeads.filter((lead) => lead.outreachStatus === "Needs Skip Trace").length,
          ),
          detail: "Records that should not move into live outreach until contact data is resolved.",
        },
        {
          label: "Mail or call in flight",
          value: formatWholeNumber(
            preforeclosureLeads.filter((lead) =>
              ["Direct Mail Sent", "Call Attempted"].includes(lead.outreachStatus),
            ).length,
          ),
          detail: "Records currently moving through direct response sequencing.",
        },
        {
          label: "Avg. urgency score",
          value: formatWholeNumber(
            Math.round(
              preforeclosureLeads.reduce((sum, lead) => sum + lead.score, 0) /
                preforeclosureLeads.length,
            ),
          ),
          detail: "Composite urgency using distress, equity, and legal timing.",
        },
      ],
      metrics: [
        {
          label: "Avg. equity",
          value: formatCurrency(
            Math.round(
              preforeclosureLeads.reduce((sum, lead) => sum + lead.estimatedEquity, 0) /
                preforeclosureLeads.length,
            ),
          ),
          detail: "A quick read on who may have the flexibility to take action.",
        },
        {
          label: "Due in 14d",
          value: formatWholeNumber(
            preforeclosureLeads.filter((lead) => isWithinDays(lead.auctionDate, 14)).length,
          ),
          detail: "Short-fuse records that belong in the daily war-room review.",
        },
        {
          label: "At-risk debt",
          value: formatCurrency(
            preforeclosureLeads.reduce((sum, lead) => sum + lead.amountOwed, 0),
          ),
          detail: "Total mortgage debt currently represented in the tracked pipeline.",
        },
      ],
    },
    duplicateGroups,
    priorityQueue: [
      ...agentLeads.map((lead) => ({
        id: lead.id,
        mode: "agent" as const,
        name: lead.name,
        summary: `${lead.intent} lead in ${lead.stage} stage from ${lead.source}.`,
        nextActionLabel: formatRelativeWindow(lead.nextActionAt),
        score: lead.score,
      })),
      ...preforeclosureLeads.map((lead) => ({
        id: lead.id,
        mode: "preforeclosure" as const,
        name: lead.ownerName,
        summary: `${lead.distressLevel} distress at ${lead.propertyAddress}. ${lead.outreachStatus}.`,
        nextActionLabel: formatRelativeWindow(lead.auctionDate),
        score: lead.score,
      })),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 4),
    recentActivity: [
      {
        name: agentLeads[0]?.name ?? "Agent lead",
        action: `Moved to ${agentLeads[0]?.stage ?? "Qualified"} and assigned a same-day follow-up.`,
        when: formatRelativeWindow(agentLeads[0]?.nextActionAt ?? new Date().toISOString()),
      },
      {
        name: preforeclosureLeads[0]?.ownerName ?? "Preforeclosure record",
        action: `${preforeclosureLeads[0]?.outreachStatus ?? "Updated"} with auction watch enabled.`,
        when: formatRelativeWindow(preforeclosureLeads[0]?.auctionDate ?? new Date().toISOString()),
      },
      {
        name: "Deduplication review",
        action: `${duplicateGroups.length} probable duplicate groups were flagged for operator review.`,
        when: "Ready now",
      },
    ],
  };
}

function createMockSnapshot() {
  return buildSnapshot(
    mockAgentLeads.map(enrichAgentLead),
    mockPreforeclosureLeads.map(enrichPreforeclosureLead),
    "demo",
  );
}

async function loadLiveSnapshot() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [agentResponse, preforeclosureResponse] = await Promise.all([
    supabase.from("agent_leads").select("*").limit(12),
    supabase.from("preforeclosure_leads").select("*").limit(12),
  ]);

  if (agentResponse.error || preforeclosureResponse.error) {
    return null;
  }

  const agentLeads = (agentResponse.data ?? []).map((row) =>
    enrichAgentLead({
      id: coerceString(row.id, crypto.randomUUID()),
      name: coerceString(row.name, "Unnamed lead"),
      city: coerceString(row.city, "Unknown market"),
      source: coerceString(row.source, "Supabase import"),
      intent: (coerceString(row.intent, "Buyer") as AgentLead["intent"]),
      stage: (coerceString(row.stage, "New") as AgentLead["stage"]),
      budget: coerceNumber(row.budget, 0),
      lastContactedAt: coerceString(row.last_contacted_at, new Date().toISOString()),
      nextActionAt: coerceString(row.next_action_at, new Date().toISOString()),
      email: coerceString(row.email, ""),
      phone: coerceString(row.phone, ""),
      tags: Array.isArray(row.tags)
        ? (row.tags as unknown[]).filter((tag: unknown): tag is string => typeof tag === "string")
        : [],
    }),
  );

  const preforeclosureLeads = (preforeclosureResponse.data ?? []).map((row) =>
    enrichPreforeclosureLead({
      id: coerceString(row.id, crypto.randomUUID()),
      ownerName: coerceString(row.owner_name, "Unnamed owner"),
      propertyAddress: coerceString(row.property_address, "Unknown property"),
      city: coerceString(row.city, "Unknown market"),
      filingDate: coerceString(row.filing_date, new Date().toISOString()),
      auctionDate: coerceString(row.auction_date, new Date().toISOString()),
      distressLevel: (coerceString(row.distress_level, "Moderate") as PreforeclosureLead["distressLevel"]),
      outreachStatus: (coerceString(
        row.outreach_status,
        "New Filing",
      ) as PreforeclosureLead["outreachStatus"]),
      assignedTo: coerceString(row.assigned_to, "Unassigned"),
      amountOwed: coerceNumber(row.amount_owed, 0),
      estimatedEquity: coerceNumber(row.estimated_equity, 0),
    }),
  );

  return buildSnapshot(agentLeads, preforeclosureLeads, "live");
}

export async function loadCrmSnapshot() {
  try {
    return (await loadLiveSnapshot()) ?? createMockSnapshot();
  } catch {
    return createMockSnapshot();
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatWholeNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}
