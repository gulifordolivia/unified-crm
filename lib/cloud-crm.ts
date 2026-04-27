"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

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
      supabase.from("agents").select("*").order("name"),
      supabase.from("preforeclosure_leads").select("*").order("manual_rank", { ascending: false }),
      supabase.from("deleted_agents").select("payload").order("deleted_at", { ascending: false }),
      supabase.from("deleted_leads").select("payload").order("deleted_at", { ascending: false }),
      supabase.from("user_settings").select("settings").eq("id", "dashboard").maybeSingle(),
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

  const { error } = await supabase.from("agents").upsert(payload);
  if (error) throw error;

  await Promise.all([
    supabase.from("notes").upsert({
      entity_type: "agent",
      entity_id: String(agent.id),
      content: agent.notes,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("follow_up_dates").upsert({
      entity_type: "agent",
      entity_id: String(agent.id),
      follow_up_date: agent.nextFollowUp,
      label: "Next follow-up",
      completed: false,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("call_text_counts").upsert({
      entity_type: "agent",
      entity_id: String(agent.id),
      calls: 0,
      texts: 0,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("statuses").upsert({
      entity_type: "agent",
      entity_id: String(agent.id),
      status: agent.nextFollowUp ? "Active follow-up" : "No follow-up",
      updated_at: new Date().toISOString(),
    }),
    supabase.from("timeline_events").upsert(
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

  const { error } = await supabase.from("preforeclosure_leads").upsert(payload);
  if (error) throw error;

  await Promise.all([
    supabase.from("notes").upsert({
      entity_type: "lead",
      entity_id: String(lead.id),
      content: lead.notes,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("call_text_counts").upsert({
      entity_type: "lead",
      entity_id: String(lead.id),
      calls: lead.calls,
      texts: lead.texts,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("statuses").upsert({
      entity_type: "lead",
      entity_id: String(lead.id),
      status: lead.status,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("map_coordinates").upsert({
      entity_type: "lead",
      entity_id: String(lead.id),
      lat: lead.lat,
      lng: lead.lng,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("follow_up_dates").delete().eq("entity_type", "lead").eq("entity_id", String(lead.id)),
    supabase.from("timeline_events").delete().eq("entity_type", "lead").eq("entity_id", String(lead.id)),
  ]);

  if (lead.followUps.length > 0) {
    const { error: followError } = await supabase.from("follow_up_dates").insert(
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

  const { error: timelineError } = await supabase.from("timeline_events").insert(timelineEvents);
  if (timelineError) throw timelineError;
}

export async function archiveAgentCloud(supabase: SupabaseClient, agent: CloudAgent) {
  const { error: insertError } = await supabase.from("deleted_agents").upsert({
    id: agent.id,
    name: agent.name,
    payload: agent,
    deleted_at: new Date().toISOString(),
  });
  if (insertError) throw insertError;

  const { error: deleteError } = await supabase.from("agents").delete().eq("id", agent.id);
  if (deleteError) throw deleteError;
}

export async function archiveLeadCloud(supabase: SupabaseClient, lead: CloudLead) {
  const { error: insertError } = await supabase.from("deleted_leads").upsert({
    id: lead.id,
    address: lead.address,
    payload: lead,
    deleted_at: new Date().toISOString(),
  });
  if (insertError) throw insertError;

  const { error: deleteError } = await supabase.from("preforeclosure_leads").delete().eq("id", lead.id);
  if (deleteError) throw deleteError;
}

export async function restoreAgentCloud(supabase: SupabaseClient, agent: CloudAgent) {
  await saveAgentCloud(supabase, agent);
  const { error } = await supabase.from("deleted_agents").delete().eq("id", agent.id);
  if (error) throw error;
}

export async function restoreLeadCloud(supabase: SupabaseClient, lead: CloudLead) {
  await saveLeadCloud(supabase, lead);
  const { error } = await supabase.from("deleted_leads").delete().eq("id", lead.id);
  if (error) throw error;
}

export async function saveSettingsCloud(supabase: SupabaseClient, settings: CloudSettings) {
  const { error } = await supabase.from("user_settings").upsert({
    id: "dashboard",
    settings,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
