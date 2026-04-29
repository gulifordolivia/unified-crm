"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

const TABLES = {
  agents: "agents",
  leads: "preforeclosure_leads",
  deletedAgents: "deleted_agents",
  deletedLeads: "deleted_leads",
  notes: "notes",
  followUpDates: "follow_up_dates",
  callTextCounts: "call_text_counts",
  statuses: "statuses",
  mapCoordinates: "map_coordinates",
  timelineEvents: "timeline_events",
  settings: "settings",
} as const;

export type CloudLead = {
  id: number;
  name: string;
  address: string;
  county: string;
  phone: string;
  email: string;
  stage: string;
  manualOverrideStage: string | null;
  auctionDate: string;
  score: number;
  status: string;
  notes: string;
  createdAt: string;
  nextFollowUp: string | null;
  followUps: Array<{ id: string; date: string; label: string; completed: boolean }>;
  calls: number;
  texts: number;
  lat: number;
  lng: number;
  source: string;
  manualRank: number;
  autoFollowUp: boolean;
  postponed: boolean;
};

export type CloudAgent = {
  id: number;
  name: string;
  phone: string;
  email: string;
  market: string;
  type: string;
  nextFollowUp: string | null;
  lastContactedAt: string | null;
  addedAt: string;
  notes: string;
  autoFollowUp: boolean;
};

export type CloudSettings = {
  theme?: string;
  mode?: string;
  search?: string;
  agentSortBy?: string;
  agentMarketFilter?: string;
  agentMetricFilter?: string | null;
  agentMetricSortBy?: string;
  agentMetricMarketFilter?: string;
  preMetricFilter?: string | null;
  preMetricSortBy?: string;
  preMetricCountyFilter?: string;
};

type SyncPayload = {
  agents: CloudAgent[];
  leads: CloudLead[];
  deletedAgents: CloudAgent[];
  deletedLeads: CloudLead[];
  settings: CloudSettings | null;
};

export function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Unknown Supabase error.";
  }

  const maybeError = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };

  const parts = [
    maybeError.message,
    maybeError.details ? `Details: ${maybeError.details}` : null,
    maybeError.hint ? `Hint: ${maybeError.hint}` : null,
    maybeError.code ? `Code: ${maybeError.code}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Unknown Supabase error.";
}

function mapLeadRow(row: Record<string, unknown>): CloudLead {
  return {
    id: Number(row.id),
    name: String(row.name ?? "New Owner"),
    address: String(row.address ?? ""),
    county: String(row.county ?? "Unknown"),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    stage: String(row.stage ?? "Early Warning"),
    manualOverrideStage:
      typeof row.manual_override_stage === "string" ? row.manual_override_stage : null,
    auctionDate: String(row.auction_date ?? new Date().toISOString().slice(0, 10)),
    score: Number(row.score ?? 0),
    status: String(row.status ?? "Not contacted"),
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString().slice(0, 10)),
    nextFollowUp: typeof row.next_follow_up === "string" ? row.next_follow_up : null,
    followUps: Array.isArray(row.follow_ups)
      ? (row.follow_ups as CloudLead["followUps"])
      : [],
    calls: Number(row.calls ?? 0),
    texts: Number(row.texts ?? 0),
    lat: Number(row.lat ?? 42.3314),
    lng: Number(row.lng ?? -83.0458),
    source: String(row.source ?? "Manual"),
    manualRank: Number(row.manual_rank ?? 0),
    autoFollowUp: Boolean(row.auto_follow_up),
    postponed: Boolean(row.postponed),
  };
}

function mapAgentRow(row: Record<string, unknown>): CloudAgent {
  return {
    id: Number(row.id),
    name: String(row.name ?? "New Agent"),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    market: String(row.market ?? "Unknown market"),
    type: String(row.type ?? "Agent"),
    nextFollowUp: typeof row.next_follow_up === "string" ? row.next_follow_up : null,
    lastContactedAt: typeof row.last_contacted_at === "string" ? row.last_contacted_at : null,
    addedAt: String(row.added_at ?? new Date().toISOString().slice(0, 10)),
    notes: String(row.notes ?? ""),
    autoFollowUp: Boolean(row.auto_follow_up),
  };
}

export async function loadCloudSyncData(supabase: SupabaseClient): Promise<SyncPayload> {
  const [agentsResponse, leadsResponse, deletedAgentsResponse, deletedLeadsResponse, settingsResponse] =
    await Promise.all([
      supabase.from(TABLES.agents).select("*").order("name"),
      supabase.from(TABLES.leads).select("*").order("manual_rank", { ascending: false }),
      supabase.from(TABLES.deletedAgents).select("payload").order("deleted_at", { ascending: false }),
      supabase.from(TABLES.deletedLeads).select("payload").order("deleted_at", { ascending: false }),
      supabase.from(TABLES.settings).select("settings").eq("id", "dashboard").maybeSingle(),
    ]);

  if (agentsResponse.error) throw agentsResponse.error;
  if (leadsResponse.error) throw leadsResponse.error;
  if (deletedAgentsResponse.error) throw deletedAgentsResponse.error;
  if (deletedLeadsResponse.error) throw deletedLeadsResponse.error;
  if (settingsResponse.error) throw settingsResponse.error;

  return {
    agents: (agentsResponse.data ?? []).map((row) => mapAgentRow(row as Record<string, unknown>)),
    leads: (leadsResponse.data ?? []).map((row) => mapLeadRow(row as Record<string, unknown>)),
    deletedAgents: (deletedAgentsResponse.data ?? [])
      .map((row) => row.payload)
      .filter(Boolean)
      .map((row) => mapAgentRow(row as Record<string, unknown>)),
    deletedLeads: (deletedLeadsResponse.data ?? [])
      .map((row) => row.payload)
      .filter(Boolean)
      .map((row) => mapLeadRow(row as Record<string, unknown>)),
    settings: (settingsResponse.data?.settings as CloudSettings | null) ?? null,
  };
}

export async function saveAgentCloud(supabase: SupabaseClient, agent: CloudAgent) {
  const payload = {
    id: agent.id,
    name: agent.name,
    phone: agent.phone,
    email: agent.email,
    market: agent.market,
    type: agent.type,
    next_follow_up: agent.nextFollowUp,
    last_contacted_at: agent.lastContactedAt,
    added_at: agent.addedAt,
    notes: agent.notes,
    auto_follow_up: agent.autoFollowUp,
  };

  const { error } = await supabase.from(TABLES.agents).upsert(payload);
  if (error) throw error;

  await Promise.all([
    supabase.from(TABLES.notes).upsert({
      entity_type: "agent",
      entity_id: String(agent.id),
      content: agent.notes,
      updated_at: new Date().toISOString(),
    }),
    supabase.from(TABLES.followUpDates).upsert({
      entity_type: "agent",
      entity_id: String(agent.id),
      follow_up_date: agent.nextFollowUp,
      label: "Next follow-up",
      completed: false,
      updated_at: new Date().toISOString(),
    }),
    supabase.from(TABLES.callTextCounts).upsert({
      entity_type: "agent",
      entity_id: String(agent.id),
      calls: 0,
      texts: 0,
      updated_at: new Date().toISOString(),
    }),
    supabase.from(TABLES.statuses).upsert({
      entity_type: "agent",
      entity_id: String(agent.id),
      status: agent.nextFollowUp ? "Active follow-up" : "No follow-up",
      updated_at: new Date().toISOString(),
    }),
    supabase.from(TABLES.timelineEvents).upsert(
      [
        agent.lastContactedAt
          ? {
              id: `agent-last-${agent.id}`,
              entity_type: "agent",
              entity_id: String(agent.id),
              event_date: agent.lastContactedAt,
              label: "Last contacted",
              completed: true,
            }
          : null,
        agent.nextFollowUp
          ? {
              id: `agent-next-${agent.id}`,
              entity_type: "agent",
              entity_id: String(agent.id),
              event_date: agent.nextFollowUp,
              label: "Next follow-up",
              completed: false,
            }
          : null,
      ].filter(Boolean),
    ),
  ]);
}

export async function saveLeadCloud(supabase: SupabaseClient, lead: CloudLead) {
  const payload = {
    id: lead.id,
    name: lead.name,
    address: lead.address,
    county: lead.county,
    phone: lead.phone,
    email: lead.email,
    stage: lead.stage,
    manual_override_stage: lead.manualOverrideStage,
    auction_date: lead.auctionDate,
    score: lead.score,
    status: lead.status,
    notes: lead.notes,
    created_at: lead.createdAt,
    next_follow_up: lead.nextFollowUp,
    follow_ups: lead.followUps,
    calls: lead.calls,
    texts: lead.texts,
    lat: lead.lat,
    lng: lead.lng,
    source: lead.source,
    manual_rank: lead.manualRank,
    auto_follow_up: lead.autoFollowUp,
    postponed: lead.postponed,
  };

  const { error } = await supabase.from(TABLES.leads).upsert(payload);
  if (error) throw error;

  await Promise.all([
    supabase.from(TABLES.notes).upsert({
      entity_type: "lead",
      entity_id: String(lead.id),
      content: lead.notes,
      updated_at: new Date().toISOString(),
    }),
    supabase.from(TABLES.callTextCounts).upsert({
      entity_type: "lead",
      entity_id: String(lead.id),
      calls: lead.calls,
      texts: lead.texts,
      updated_at: new Date().toISOString(),
    }),
    supabase.from(TABLES.statuses).upsert({
      entity_type: "lead",
      entity_id: String(lead.id),
      status: lead.status,
      updated_at: new Date().toISOString(),
    }),
    supabase.from(TABLES.mapCoordinates).upsert({
      entity_type: "lead",
      entity_id: String(lead.id),
      lat: lead.lat,
      lng: lead.lng,
      updated_at: new Date().toISOString(),
    }),
    supabase.from(TABLES.followUpDates).delete().eq("entity_type", "lead").eq("entity_id", String(lead.id)),
    supabase.from(TABLES.timelineEvents).delete().eq("entity_type", "lead").eq("entity_id", String(lead.id)),
  ]);

  if (lead.followUps.length > 0) {
    const { error: followError } = await supabase.from(TABLES.followUpDates).insert(
      lead.followUps.map((item) => ({
        id: item.id,
        entity_type: "lead",
        entity_id: String(lead.id),
        follow_up_date: item.date,
        label: item.label,
        completed: item.completed,
        updated_at: new Date().toISOString(),
      })),
    );
    if (followError) throw followError;
  }

  const timelineEvents = [
    {
      id: `${lead.id}-created`,
      entity_type: "lead",
      entity_id: String(lead.id),
      event_date: lead.createdAt,
      label: "Logged",
      completed: true,
    },
    ...lead.followUps.map((item) => ({
      id: item.id,
      entity_type: "lead" as const,
      entity_id: String(lead.id),
      event_date: item.date,
      label: item.label,
      completed: item.completed,
    })),
    {
      id: `${lead.id}-auction`,
      entity_type: "lead",
      entity_id: String(lead.id),
      event_date: lead.auctionDate,
      label: "Auction",
      completed: false,
    },
  ];

  const { error: timelineError } = await supabase.from(TABLES.timelineEvents).insert(timelineEvents);
  if (timelineError) throw timelineError;
}

export async function archiveAgentCloud(supabase: SupabaseClient, agent: CloudAgent) {
  const { error: insertError } = await supabase.from(TABLES.deletedAgents).upsert({
    id: agent.id,
    name: agent.name,
    payload: agent,
    deleted_at: new Date().toISOString(),
  });
  if (insertError) throw insertError;

  const { error: deleteError } = await supabase.from(TABLES.agents).delete().eq("id", agent.id);
  if (deleteError) throw deleteError;
}

export async function archiveLeadCloud(supabase: SupabaseClient, lead: CloudLead) {
  const { error: insertError } = await supabase.from(TABLES.deletedLeads).upsert({
    id: lead.id,
    address: lead.address,
    payload: lead,
    deleted_at: new Date().toISOString(),
  });
  if (insertError) throw insertError;

  const { error: deleteError } = await supabase.from(TABLES.leads).delete().eq("id", lead.id);
  if (deleteError) throw deleteError;
}

export async function restoreAgentCloud(supabase: SupabaseClient, agent: CloudAgent) {
  await saveAgentCloud(supabase, agent);
  const { error } = await supabase.from(TABLES.deletedAgents).delete().eq("id", agent.id);
  if (error) throw error;
}

export async function restoreLeadCloud(supabase: SupabaseClient, lead: CloudLead) {
  await saveLeadCloud(supabase, lead);
  const { error } = await supabase.from(TABLES.deletedLeads).delete().eq("id", lead.id);
  if (error) throw error;
}

export async function saveSettingsCloud(supabase: SupabaseClient, settings: CloudSettings) {
  const { error } = await supabase.from(TABLES.settings).upsert({
    id: "dashboard",
    settings,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
