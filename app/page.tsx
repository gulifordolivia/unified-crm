"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from "@/lib/supabase-browser";
import {
  archiveAgentCloud,
  archiveLeadCloud,
  loadCloudSyncData,
  restoreAgentCloud,
  restoreLeadCloud,
  saveAgentCloud,
  saveLeadCloud,
  saveSettingsCloud,
} from "@/lib/cloud-crm";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  Home,
  ListChecks,
  Mail,
  MapPin,
  Moon,
  Phone,
  Plus,
  Route,
  Search,
  SunMedium,
  Trash2,
  Users,
} from "lucide-react";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <Card className="rounded-3xl border bg-white/90 shadow-sm">
      <CardContent className="p-6 text-sm text-zinc-500">Loading map view…</CardContent>
    </Card>
  ),
});

type ThemeMode = "light" | "dark";
type DashboardMode = "pre" | "agents" | "map";

type FollowUpDot = {
  id: string;
  date: string;
  label: string;
  completed: boolean;
};

type Lead = {
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
  followUps: FollowUpDot[];
  calls: number;
  texts: number;
  lat: number;
  lng: number;
  source: string;
  manualRank: number;
  autoFollowUp: boolean;
  postponed: boolean;
};

type Agent = {
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

type DuplicateWarning = {
  address: string;
  existing: string;
};

type MetricProps = {
  title: string;
  value: number | string;
  sub: string;
  hot?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  dark?: boolean;
};

type PreQuickAddForm = {
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  county: string;
  auctionDate: string;
  notes: string;
  autoFollowUp: boolean;
  customFollowUp: string;
  showCalendar: boolean;
};

type AgentQuickAddForm = {
  name: string;
  phone: string;
  email: string;
  market: string;
  type: string;
  notes: string;
  autoFollowUp: boolean;
  customFollowUp: string;
  showCalendar: boolean;
};

type LeadEditForm = {
  name: string;
  address: string;
  phone: string;
  email: string;
  county: string;
  auctionDate: string;
  nextFollowUp: string;
  notes: string;
  postponed: boolean;
};

type AgentEditForm = {
  name: string;
  phone: string;
  email: string;
  market: string;
  type: string;
  nextFollowUp: string;
  notes: string;
  autoFollowUp: boolean;
};

type ImportSummary = {
  added: number;
  duplicates: number;
  review: string[];
};

type PreMetricFilter = "total" | "dueToday" | "auctionSoon" | "postponed" | null;
type AgentMetricFilter = "total" | "dueToday" | "dueTomorrow" | "dueSoon" | "auto10Day" | null;

const stages = [
  "Early Warning",
  "Low Urgency",
  "Rising Urgency",
  "High Urgency",
  "Critical",
  "Final Push",
  "Postponed",
  "Expired",
];

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const startingLeads: Lead[] = [
  {
    id: 1,
    name: "Anthony Reed",
    address: "1809 Clover Ave, Detroit, MI",
    county: "Wayne",
    phone: "313-555-4001",
    email: "",
    stage: "Final Push",
    manualOverrideStage: null,
    auctionDate: "2026-04-25",
    score: 14,
    status: "No Answer",
    notes: "Vacant, tax delinquent, absentee owner. Needs quick follow-up.",
    createdAt: "2026-04-08",
    nextFollowUp: "2026-04-23",
    followUps: [
      { id: "1-f1", date: "2026-04-12", label: "Intro call", completed: true },
      { id: "1-f2", date: "2026-04-17", label: "Voicemail", completed: true },
      { id: "1-f3", date: "2026-04-23", label: "Today", completed: false },
    ],
    calls: 2,
    texts: 1,
    lat: 42.3722,
    lng: -83.0635,
    source: "Manual",
    manualRank: 0,
    autoFollowUp: true,
    postponed: false,
  },
  {
    id: 2,
    name: "Brenda Cole",
    address: "794 E 99th St, Detroit, MI",
    county: "Wayne",
    phone: "313-555-2202",
    email: "",
    stage: "Rising Urgency",
    manualOverrideStage: null,
    auctionDate: "2026-05-09",
    score: 8,
    status: "Interested",
    notes: "Owner asked for callback. Possible offer opportunity.",
    createdAt: "2026-04-11",
    nextFollowUp: "2026-04-24",
    followUps: [{ id: "2-f1", date: "2026-04-18", label: "Callback", completed: true }],
    calls: 1,
    texts: 0,
    lat: 42.4301,
    lng: -83.0174,
    source: "Manual",
    manualRank: 0,
    autoFollowUp: false,
    postponed: false,
  },
  {
    id: 3,
    name: "Darnell Price",
    address: "22114 Harper Blvd, Roseville, MI",
    county: "Macomb",
    phone: "586-555-9090",
    email: "",
    stage: "Postponed",
    manualOverrideStage: null,
    auctionDate: "2026-05-03",
    score: 15,
    status: "Left Voicemail",
    notes: "Postponed once already. Very important follow-up.",
    createdAt: "2026-04-05",
    nextFollowUp: "2026-04-23",
    followUps: [
      { id: "3-f1", date: "2026-04-10", label: "Mail drop", completed: true },
      { id: "3-f2", date: "2026-04-20", label: "Re-check", completed: true },
    ],
    calls: 4,
    texts: 2,
    lat: 42.5035,
    lng: -82.9364,
    source: "Manual",
    manualRank: 0,
    autoFollowUp: true,
    postponed: true,
  },
  {
    id: 4,
    name: "Helen Morris",
    address: "40409 Birch Run, Sterling Heights, MI",
    county: "Macomb",
    phone: "586-555-0044",
    email: "",
    stage: "Expired",
    manualOverrideStage: null,
    auctionDate: "2026-04-20",
    score: 3,
    status: "Could not reach",
    notes: "Auction passed. Keep only if updated.",
    createdAt: "2026-03-28",
    nextFollowUp: null,
    followUps: [{ id: "4-f1", date: "2026-04-02", label: "Skip trace", completed: true }],
    calls: 3,
    texts: 2,
    lat: 42.5803,
    lng: -83.0302,
    source: "Manual",
    manualRank: 0,
    autoFollowUp: false,
    postponed: false,
  },
  {
    id: 5,
    name: "Marisol Vega",
    address: "905 Lakeview Dr, Warren, MI",
    county: "Macomb",
    phone: "586-555-4499",
    email: "",
    stage: "Critical",
    manualOverrideStage: null,
    auctionDate: "2026-04-29",
    score: 12,
    status: "Maybe Interested",
    notes: "Asked for payoff details before agreeing to meet.",
    createdAt: "2026-04-14",
    nextFollowUp: "2026-04-24",
    followUps: [{ id: "5-f1", date: "2026-04-19", label: "Docs sent", completed: true }],
    calls: 2,
    texts: 1,
    lat: 42.5145,
    lng: -83.0147,
    source: "Manual",
    manualRank: 0,
    autoFollowUp: true,
    postponed: false,
  },
];

const startingAgents: Agent[] = [
  {
    id: 1,
    name: "Sarah Klein",
    phone: "586-555-2121",
    email: "sarah@macombhomes.com",
    market: "Macomb County",
    type: "Agent",
    nextFollowUp: "2026-04-23",
    lastContactedAt: "2026-04-18",
    addedAt: "2026-03-20",
    notes: "Sends fixer listings occasionally.",
    autoFollowUp: true,
  },
  {
    id: 2,
    name: "Mike Torres",
    phone: "313-555-7878",
    email: "mike@detroitbuyers.com",
    market: "Detroit",
    type: "Wholesaler",
    nextFollowUp: "2026-04-22",
    lastContactedAt: "2026-04-12",
    addedAt: "2026-03-04",
    notes: "Has buyers for east side deals.",
    autoFollowUp: true,
  },
  {
    id: 3,
    name: "Julia Benton",
    phone: "248-555-6720",
    email: "julia@oaklandlistings.com",
    market: "Oakland County",
    type: "Agent",
    nextFollowUp: "2026-05-03",
    lastContactedAt: "2026-04-20",
    addedAt: "2026-04-10",
    notes: "Retail-heavy agent.",
    autoFollowUp: false,
  },
  {
    id: 4,
    name: "Aaron Bell",
    phone: "734-555-1122",
    email: "aaron@waynecondos.com",
    market: "Wayne County",
    type: "Agent",
    nextFollowUp: "2026-04-24",
    lastContactedAt: "2026-04-21",
    addedAt: "2026-04-18",
    notes: "Strong condo inventory partner.",
    autoFollowUp: true,
  },
  {
    id: 5,
    name: "Zoe Marshall",
    phone: "248-555-4200",
    email: "zoe@duplexfund.com",
    market: "Oakland County",
    type: "Investor",
    nextFollowUp: "2026-04-30",
    lastContactedAt: "2026-04-17",
    addedAt: "2026-04-07",
    notes: "Prefers duplex and small multifamily deals.",
    autoFollowUp: false,
  },
];

const stageWeights: Record<string, number> = {
  "Early Warning": 8,
  "Low Urgency": 7,
  "Rising Urgency": 6,
  "High Urgency": 5,
  Critical: 4,
  "Final Push": 3,
  Postponed: 2,
  Expired: 1,
};

function stageStyle(stage: string) {
  if (stage === "Early Warning") return "bg-teal-100 text-teal-700";
  if (stage === "Low Urgency") return "bg-emerald-100 text-emerald-700";
  if (stage === "Rising Urgency") return "bg-blue-100 text-blue-700";
  if (stage === "High Urgency") return "bg-amber-100 text-amber-800";
  if (stage === "Critical") return "bg-orange-100 text-orange-700";
  if (stage === "Final Push") return "bg-red-100 text-red-700";
  if (stage === "Postponed") return "bg-purple-100 text-purple-700";
  if (stage === "Expired") return "bg-zinc-200 text-zinc-700";
  return "bg-zinc-100 text-zinc-700";
}

function Metric({ title, value, sub, icon: Icon, hot, dark }: MetricProps) {
  return (
    <Card
      className={`rounded-3xl shadow-sm ${hot ? "border-red-200 bg-red-50" : dark ? "border-white/10 bg-zinc-900/85" : "bg-white"}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`text-sm ${dark && !hot ? "text-zinc-400" : "text-zinc-500"}`}>
              {title}
            </div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
            <div className={`mt-1 text-xs ${dark && !hot ? "text-zinc-400" : "text-zinc-500"}`}>
              {sub}
            </div>
          </div>
          <div className={`rounded-2xl p-3 shadow-sm ${dark && !hot ? "bg-zinc-800" : "bg-white"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeAddress(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return "Not set";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${dateValue}T12:00:00`),
  );
}

function differenceInDays(dateValue: string) {
  const today = new Date();
  const target = new Date(`${dateValue}T12:00:00`);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function dueLabel(dateValue: string | null) {
  if (!dateValue) return "No follow-up";
  const diff = differenceInDays(dateValue);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

function scheduleFollowUp(status: string, baseDate: string) {
  if (status === "Interested") return addDays(baseDate, 1);
  if (status === "Maybe Interested") return addDays(baseDate, 2);
  if (status === "Left Voicemail") return addDays(baseDate, 2);
  if (status === "No Answer") return addDays(baseDate, 1);
  if (status === "Wrong Number") return null;
  if (status === "Not Interested") return null;
  return addDays(baseDate, 3);
}

function getAutoStage(lead: Lead) {
  if (lead.postponed || lead.stage === "Postponed") return "Postponed";
  const daysUntilAuction = differenceInDays(lead.auctionDate);
  if (daysUntilAuction < 0) return "Expired";
  if (daysUntilAuction <= 2) return "Final Push";
  if (daysUntilAuction <= 6) return "Critical";
  if (daysUntilAuction <= 13) return "High Urgency";
  if (daysUntilAuction <= 29) return "Rising Urgency";
  if (daysUntilAuction <= 59) return "Low Urgency";
  return "Early Warning";
}

function getLeadStage(lead: Lead) {
  return lead.manualOverrideStage ?? getAutoStage(lead);
}

function sortLeadsForPipeline(a: Lead, b: Lead) {
  const scoreDiff = b.score - a.score;
  if (scoreDiff !== 0) return scoreDiff;
  const auctionDiff =
    new Date(`${a.auctionDate}T12:00:00`).getTime() -
    new Date(`${b.auctionDate}T12:00:00`).getTime();
  if (auctionDiff !== 0) return auctionDiff;
  return (stageWeights[getLeadStage(a)] ?? 0) - (stageWeights[getLeadStage(b)] ?? 0);
}

function buildTimeline(lead: Lead) {
  const points = [
    { id: `${lead.id}-created`, date: lead.createdAt, label: "Logged", completed: true },
    ...lead.followUps,
    { id: `${lead.id}-auction`, date: lead.auctionDate, label: "Auction", completed: false },
  ]
    .sort(
      (a, b) =>
        new Date(`${a.date}T12:00:00`).getTime() - new Date(`${b.date}T12:00:00`).getTime(),
    )
    .filter((point, index, arr) => index === arr.findIndex((item) => item.id === point.id));

  const start = new Date(`${lead.createdAt}T12:00:00`).getTime();
  const end = new Date(`${lead.auctionDate}T12:00:00`).getTime();
  const span = Math.max(end - start, 1);
  const today = Date.now();
  const progress = Math.min(100, Math.max(0, ((today - start) / span) * 100));

  return {
    points: points.map((point) => ({
      ...point,
      position: `${Math.min(
        100,
        Math.max(
          0,
          ((new Date(`${point.date}T12:00:00`).getTime() - start) / span) * 100,
        ),
      )}%`,
    })),
    progress,
    daysToAuction: differenceInDays(lead.auctionDate),
  };
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function compareAgents(sortBy: "alphabetical" | "recent" | "market") {
  return (a: Agent, b: Agent) => {
    if (sortBy === "recent") {
      return (
        new Date(`${b.addedAt}T12:00:00`).getTime() - new Date(`${a.addedAt}T12:00:00`).getTime()
      );
    }

    if (sortBy === "market") {
      const marketCompare = a.market.localeCompare(b.market);
      if (marketCompare !== 0) return marketCompare;
      return a.name.localeCompare(b.name);
    }

    return a.name.localeCompare(b.name);
  };
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function looksLikeAddress(value: string) {
  return /\d/.test(value) && /(st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|ct|court|ln|lane|way|pl|place|trl|trail)\b/i.test(value);
}

function looksLikeCountyOrMarket(value: string) {
  return /(county|detroit|oakland|wayne|macomb|sterling heights|roseville|warren|dearborn|pontiac)/i.test(
    value,
  );
}

function parseDateValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }
  const normalized = trimmed.replace(/\./g, "/").replace(/-/g, "/");
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function tokenizeImportRow(row: string) {
  if (row.includes("\t")) {
    return row.split("\t").map((part) => part.trim()).filter(Boolean);
  }
  if (row.includes("|")) {
    return row.split("|").map((part) => part.trim()).filter(Boolean);
  }
  if (row.includes(",")) {
    return row.split(",").map((part) => part.trim()).filter(Boolean);
  }
  if (row.includes(";")) {
    return row.split(";").map((part) => part.trim()).filter(Boolean);
  }
  return row
    .split(/\s{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitImportRows(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripToken(source: string, token: string) {
  if (!token) return source.trim();
  return source.replace(token, " ").replace(/\s{2,}/g, " ").replace(/^[,\-|; ]+|[,\-|; ]+$/g, "").trim();
}

function extractEmail(row: string) {
  const match = row.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? "";
}

function extractPhone(row: string) {
  const match = row.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  return match?.[0] ?? "";
}

function extractDateToken(row: string) {
  const match = row.match(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b/i);
  return match?.[0] ?? "";
}

function dedupeAgents(existing: Agent[], candidate: Pick<Agent, "name" | "phone" | "email">) {
  const normalizedCandidateName = normalizeName(candidate.name);
  const normalizedCandidatePhone = normalizePhone(candidate.phone);
  const normalizedCandidateEmail = candidate.email.trim().toLowerCase();

  return existing.some((agent) => {
    return (
      (normalizedCandidatePhone && normalizePhone(agent.phone) === normalizedCandidatePhone) ||
      (normalizedCandidateEmail && agent.email.trim().toLowerCase() === normalizedCandidateEmail) ||
      (normalizedCandidateName && normalizeName(agent.name) === normalizedCandidateName)
    );
  });
}

function dedupeLeads(existing: Lead[], candidate: Pick<Lead, "address" | "phone" | "source">) {
  const normalizedCandidateAddress = normalizeAddress(candidate.address);
  const normalizedCandidatePhone = normalizePhone(candidate.phone);
  const normalizedCandidateSource = candidate.source.trim().toLowerCase();

  return existing.some((lead) => {
    return (
      (normalizedCandidateAddress && normalizeAddress(lead.address) === normalizedCandidateAddress) ||
      (normalizedCandidatePhone && normalizePhone(lead.phone) === normalizedCandidatePhone) ||
      (!!normalizedCandidateSource &&
        lead.source.trim().toLowerCase() === normalizedCandidateSource &&
        normalizeAddress(lead.address) === normalizedCandidateAddress)
    );
  });
}

function inferAgentType(value: string) {
  if (/wholesale/i.test(value)) return "Wholesaler";
  if (/investor|buyer/i.test(value)) return "Investor";
  if (/lender|loan/i.test(value)) return "Lender";
  return "Agent";
}

function parseAgentImportRow(row: string) {
  const tokens = tokenizeImportRow(row);
  const email = extractEmail(row);
  const phone = extractPhone(row);
  const dateToken = extractDateToken(row);
  const explicitFollowUp = dateToken ? parseDateValue(dateToken) : null;

  const leftovers = tokens.filter((token) => {
    const normalized = token.trim();
    return (
      normalized &&
      normalized !== email &&
      normalized !== phone &&
      normalized !== dateToken
    );
  });

  const name = leftovers.shift() ?? stripToken(stripToken(stripToken(row, email), phone), dateToken);
  const marketIndex = leftovers.findIndex(looksLikeCountyOrMarket);
  const market = marketIndex >= 0 ? leftovers.splice(marketIndex, 1)[0] : "";
  const typeIndex = leftovers.findIndex((token) => /(agent|wholesaler|investor|lender|broker)/i.test(token));
  const type = typeIndex >= 0 ? inferAgentType(leftovers.splice(typeIndex, 1)[0]) : "Agent";
  const notes = leftovers.join(" | ").trim();
  const review = [];

  if (!name) review.push("missing name");
  if (!phone && !email) review.push("missing primary contact");

  return {
    name: titleCase(name || "New Agent"),
    phone,
    email,
    market: market || "Unknown market",
    type,
    notes,
    explicitFollowUp,
    review,
  };
}

function parseLeadImportRow(row: string) {
  const tokens = tokenizeImportRow(row);
  const email = extractEmail(row);
  const phone = extractPhone(row);
  const dateToken = extractDateToken(row);
  const auctionDate = dateToken ? parseDateValue(dateToken) : null;

  const leftovers = tokens.filter((token) => {
    const normalized = token.trim();
    return (
      normalized &&
      normalized !== email &&
      normalized !== phone &&
      normalized !== dateToken
    );
  });

  const addressIndex = leftovers.findIndex(looksLikeAddress);
  const address = addressIndex >= 0 ? leftovers.splice(addressIndex, 1)[0] : "";
  const countyIndex = leftovers.findIndex(looksLikeCountyOrMarket);
  const county = countyIndex >= 0 ? leftovers.splice(countyIndex, 1)[0] : "";
  const sourceIndex = leftovers.findIndex((token) => /(source|zillow|auction|batch|csv|spreadsheet|manual|import)/i.test(token));
  const source = sourceIndex >= 0 ? leftovers.splice(sourceIndex, 1)[0] : "Mass Import";
  const ownerName = leftovers.shift() ?? "";
  const notes = leftovers.join(" | ").trim();
  const review = [];

  if (!ownerName) review.push("missing owner name");
  if (!address) review.push("missing property address");
  if (!auctionDate) review.push("missing auction date");

  return {
    name: titleCase(ownerName || "New Owner"),
    address,
    phone,
    email,
    county: county || "Unknown",
    auctionDate,
    notes,
    source,
    review,
  };
}

export default function OptimizedUnifiedCrmPreview() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const hasCloud = useMemo(() => hasSupabaseBrowserEnv() && Boolean(supabase), [supabase]);
  const [mode, setMode] = useState<DashboardMode>("pre");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("unified-crm-theme");
    return stored === "dark" || stored === "light" ? stored : "light";
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deletedLeads, setDeletedLeads] = useState<Lead[]>([]);
  const [deletedAgents, setDeletedAgents] = useState<Agent[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [newAddress, setNewAddress] = useState("");
  const [preQuickAdd, setPreQuickAdd] = useState<PreQuickAddForm>({
    ownerName: "",
    address: "",
    phone: "",
    email: "",
    county: "",
    auctionDate: "",
    notes: "",
    autoFollowUp: true,
    customFollowUp: "",
    showCalendar: false,
  });
  const [agentQuickAdd, setAgentQuickAdd] = useState<AgentQuickAddForm>({
    name: "",
    phone: "",
    email: "",
    market: "",
    type: "Agent",
    notes: "",
    autoFollowUp: true,
    customFollowUp: "",
    showCalendar: false,
  });
  const [leadCalendarOpen, setLeadCalendarOpen] = useState(false);
  const [agentSortBy, setAgentSortBy] = useState<"alphabetical" | "recent" | "market">(
    "alphabetical",
  );
  const [agentMarketFilter, setAgentMarketFilter] = useState("All markets");
  const [agentMetricFilter, setAgentMetricFilter] = useState<AgentMetricFilter>(null);
  const [agentMetricSortBy, setAgentMetricSortBy] = useState<"alphabetical" | "recent">(
    "alphabetical",
  );
  const [agentMetricMarketFilter, setAgentMetricMarketFilter] = useState("All markets");
  const [preMetricFilter, setPreMetricFilter] = useState<PreMetricFilter>(null);
  const [preMetricSortBy, setPreMetricSortBy] = useState<"alphabetical" | "recent">(
    "alphabetical",
  );
  const [preMetricCountyFilter, setPreMetricCountyFilter] = useState("All counties");
  const [leadMassInput, setLeadMassInput] = useState("");
  const [agentMassInput, setAgentMassInput] = useState("");
  const [leadImportSummary, setLeadImportSummary] = useState<ImportSummary | null>(null);
  const [agentImportSummary, setAgentImportSummary] = useState<ImportSummary | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [leadEditForm, setLeadEditForm] = useState<LeadEditForm | null>(null);
  const [editingAgentId, setEditingAgentId] = useState<number | null>(null);
  const [agentEditForm, setAgentEditForm] = useState<AgentEditForm | null>(null);
  const [syncState, setSyncState] = useState<"loading" | "saving" | "saved" | "error" | "demo">(
    hasCloud ? "loading" : "demo",
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const sequenceRef = useRef(1000);
  const leadDetailRef = useRef<HTMLDivElement | null>(null);

  const nextSequence = () => {
    sequenceRef.current += 1;
    return sequenceRef.current;
  };

  useEffect(() => {
    window.localStorage.setItem("unified-crm-theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!supabase || !hasCloud) {
        if (!active) return;
        setLeads(startingLeads);
        setAgents(startingAgents);
        setDeletedLeads([]);
        setDeletedAgents([]);
        setSelectedLeadId(startingLeads[0]?.id ?? null);
        setSyncState("demo");
        setSyncMessage("Demo Mode — data may reset.");
        return;
      }

      try {
        setSyncState("loading");
        const payload = await loadCloudSyncData(supabase);
        if (!active) return;

        const nextLeads = payload.leads;
        const nextAgents = payload.agents;

        setLeads(nextLeads);
        setAgents(nextAgents);
        setDeletedLeads(payload.deletedLeads);
        setDeletedAgents(payload.deletedAgents);
        setSelectedLeadId(nextLeads[0]?.id ?? null);

        if (payload.settings?.theme === "dark" || payload.settings?.theme === "light") {
          setTheme(payload.settings.theme);
        }
        if (payload.settings?.mode === "agents" || payload.settings?.mode === "pre" || payload.settings?.mode === "map") {
          setMode(payload.settings.mode);
        }
        if (typeof payload.settings?.search === "string") setSearch(payload.settings.search);
        if (payload.settings?.agentSortBy === "alphabetical" || payload.settings?.agentSortBy === "recent" || payload.settings?.agentSortBy === "market") {
          setAgentSortBy(payload.settings.agentSortBy);
        }
        if (typeof payload.settings?.agentMarketFilter === "string") setAgentMarketFilter(payload.settings.agentMarketFilter);
        if (payload.settings?.agentMetricFilter === null || typeof payload.settings?.agentMetricFilter === "string") {
          setAgentMetricFilter((payload.settings.agentMetricFilter as AgentMetricFilter) ?? null);
        }
        if (payload.settings?.agentMetricSortBy === "alphabetical" || payload.settings?.agentMetricSortBy === "recent") {
          setAgentMetricSortBy(payload.settings.agentMetricSortBy);
        }
        if (typeof payload.settings?.agentMetricMarketFilter === "string") setAgentMetricMarketFilter(payload.settings.agentMetricMarketFilter);
        if (payload.settings?.preMetricFilter === null || typeof payload.settings?.preMetricFilter === "string") {
          setPreMetricFilter((payload.settings.preMetricFilter as PreMetricFilter) ?? null);
        }
        if (payload.settings?.preMetricSortBy === "alphabetical" || payload.settings?.preMetricSortBy === "recent") {
          setPreMetricSortBy(payload.settings.preMetricSortBy);
        }
        if (typeof payload.settings?.preMetricCountyFilter === "string") setPreMetricCountyFilter(payload.settings.preMetricCountyFilter);

        setSyncState("saved");
        setSyncMessage("Cloud Sync On");
      } catch (error) {
        if (!active) return;
        setLeads(startingLeads);
        setAgents(startingAgents);
        setDeletedLeads([]);
        setDeletedAgents([]);
        setSelectedLeadId(startingLeads[0]?.id ?? null);
        setSyncState("error");
        setSyncMessage(error instanceof Error ? error.message : "Could not load Supabase data.");
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [hasCloud, supabase]);

  useEffect(() => {
    if (!supabase || !hasCloud) return;

    const channel = supabase
      .channel("crm-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, async () => {
        const payload = await loadCloudSyncData(supabase);
        setAgents(payload.agents);
        setDeletedAgents(payload.deletedAgents);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "preforeclosure_leads" }, async () => {
        const payload = await loadCloudSyncData(supabase);
        setLeads(payload.leads);
        setDeletedLeads(payload.deletedLeads);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "deleted_agents" }, async () => {
        const payload = await loadCloudSyncData(supabase);
        setDeletedAgents(payload.deletedAgents);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "deleted_leads" }, async () => {
        const payload = await loadCloudSyncData(supabase);
        setDeletedLeads(payload.deletedLeads);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_settings" }, async () => {
        const payload = await loadCloudSyncData(supabase);
        if (payload.settings?.theme === "dark" || payload.settings?.theme === "light") {
          setTheme(payload.settings.theme);
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hasCloud, supabase]);

  useEffect(() => {
    if (!supabase || !hasCloud || syncState === "loading") return;

    const timeout = window.setTimeout(() => {
      void saveSettingsCloud(supabase, {
        theme,
        mode,
        search,
        agentSortBy,
        agentMarketFilter,
        agentMetricFilter,
        agentMetricSortBy,
        agentMetricMarketFilter,
        preMetricFilter,
        preMetricSortBy,
        preMetricCountyFilter,
      }).catch((error) => {
        setSyncState("error");
        setSyncMessage(error instanceof Error ? error.message : "Could not save settings.");
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [
    agentMarketFilter,
    agentMetricFilter,
    agentMetricMarketFilter,
    agentMetricSortBy,
    agentSortBy,
    hasCloud,
    mode,
    preMetricCountyFilter,
    preMetricFilter,
    preMetricSortBy,
    search,
    supabase,
    syncState,
    theme,
  ]);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0] ?? null;

  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((lead) =>
      [lead.name, lead.address, lead.county, getLeadStage(lead), lead.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [leads, search]);

  const dailyQueue = useMemo(
    () =>
      [...leads]
        .filter((lead) => {
          if (!lead.nextFollowUp) return false;
          return differenceInDays(lead.nextFollowUp) <= 0;
        })
        .sort(sortLeadsForPipeline),
    [leads],
  );

  const groupedStageLeads = useMemo(() => {
    return stages.map((stage) => ({
      stage,
      items: [...filteredLeads].filter((lead) => getLeadStage(lead) === stage).sort(sortLeadsForPipeline),
    }));
  }, [filteredLeads]);

  const preMetricCountyOptions = useMemo(
    () => ["All counties", ...new Set(leads.map((lead) => lead.county))],
    [leads],
  );

  const preMetricLeads = useMemo(() => {
    let items = [...leads];

    if (preMetricFilter === "dueToday") {
      items = items.filter((lead) => lead.nextFollowUp && differenceInDays(lead.nextFollowUp) <= 0);
    } else if (preMetricFilter === "auctionSoon") {
      items = items.filter((lead) => {
        const days = differenceInDays(lead.auctionDate);
        return days >= 0 && days < 7;
      });
    } else if (preMetricFilter === "postponed") {
      items = items.filter((lead) => getLeadStage(lead) === "Postponed");
    }

    if (preMetricCountyFilter !== "All counties") {
      items = items.filter((lead) => lead.county === preMetricCountyFilter);
    }

    return items.sort((a, b) => {
      if (preMetricSortBy === "recent") {
        return (
          new Date(`${b.createdAt}T12:00:00`).getTime() -
          new Date(`${a.createdAt}T12:00:00`).getTime()
        );
      }
      return a.name.localeCompare(b.name);
    });
  }, [leads, preMetricCountyFilter, preMetricFilter, preMetricSortBy]);

  const filteredAgents = useMemo(() => {
    const q = search.toLowerCase();
    return [...agents]
      .filter((agent) =>
        [agent.name, agent.market, agent.type, agent.notes].join(" ").toLowerCase().includes(q),
      )
      .filter((agent) => agentMarketFilter === "All markets" || agent.market === agentMarketFilter)
      .sort(compareAgents(agentSortBy));
  }, [agents, agentMarketFilter, agentSortBy, search]);

  const alphabeticalAgentGroups = useMemo(
    () =>
      alphabet
        .map((letter) => ({
          id: `alpha-${letter}`,
          label: letter,
          items: filteredAgents.filter((agent) => agent.name.toUpperCase().startsWith(letter)),
        }))
        .filter((group) => group.items.length > 0),
    [filteredAgents],
  );

  const recentAgentGroups = useMemo(() => {
    const today = getTodayDate();
    const weekCutoff = addDays(today, -7);
    const monthCutoff = addDays(today, -30);

    return [
      {
        id: "recent-today",
        label: "Today",
        items: filteredAgents.filter((agent) => agent.addedAt === today),
      },
      {
        id: "recent-week",
        label: "This Week",
        items: filteredAgents.filter(
          (agent) => agent.addedAt < today && agent.addedAt >= weekCutoff,
        ),
      },
      {
        id: "recent-month",
        label: "This Month",
        items: filteredAgents.filter(
          (agent) => agent.addedAt < weekCutoff && agent.addedAt >= monthCutoff,
        ),
      },
      {
        id: "recent-older",
        label: "Older",
        items: filteredAgents.filter((agent) => agent.addedAt < monthCutoff),
      },
    ].filter((group) => group.items.length > 0);
  }, [filteredAgents]);

  const agentMarkets = useMemo(
    () => ["All markets", ...new Set(agents.map((agent) => agent.market))],
    [agents],
  );

  const marketAgentGroups = useMemo(
    () =>
      agentMarkets
        .filter((market) => market !== "All markets")
        .map((market) => ({
          id: `market-${market.replace(/\s+/g, "-").toLowerCase()}`,
          label: market,
          items: filteredAgents.filter((agent) => agent.market === market),
        }))
        .filter((group) => group.items.length > 0),
    [agentMarkets, filteredAgents],
  );

  const primaryAgentGroups = useMemo(() => {
    if (agentSortBy === "recent") {
      return recentAgentGroups;
    }

    if (agentSortBy === "alphabetical") {
      return alphabeticalAgentGroups;
    }

    return marketAgentGroups;
  }, [agentSortBy, alphabeticalAgentGroups, marketAgentGroups, recentAgentGroups]);

  const agentMetricAgents = useMemo(() => {
    let items = [...agents];

    if (agentMetricFilter === "dueToday") {
      items = items.filter((agent) => agent.nextFollowUp && differenceInDays(agent.nextFollowUp) === 0);
    } else if (agentMetricFilter === "dueTomorrow") {
      items = items.filter((agent) => agent.nextFollowUp && differenceInDays(agent.nextFollowUp) === 1);
    } else if (agentMetricFilter === "dueSoon") {
      items = items.filter((agent) => {
        if (!agent.nextFollowUp) return false;
        const diff = differenceInDays(agent.nextFollowUp);
        return diff >= 0 && diff <= 7;
      });
    } else if (agentMetricFilter === "auto10Day") {
      items = items.filter((agent) => agent.autoFollowUp);
    }

    if (agentMetricMarketFilter !== "All markets") {
      items = items.filter((agent) => agent.market === agentMetricMarketFilter);
    }

    return items.sort((a, b) => {
      if (agentMetricSortBy === "recent") {
        return (
          new Date(`${b.addedAt}T12:00:00`).getTime() -
          new Date(`${a.addedAt}T12:00:00`).getTime()
        );
      }
      return a.name.localeCompare(b.name);
    });
  }, [agentMetricFilter, agentMetricMarketFilter, agentMetricSortBy, agents]);

  const agentMetrics = useMemo(() => {
    const dueToday = agents.filter((agent) => agent.nextFollowUp && differenceInDays(agent.nextFollowUp) === 0).length;
    const dueTomorrow = agents.filter((agent) => agent.nextFollowUp && differenceInDays(agent.nextFollowUp) === 1).length;
    const dueSoon = agents.filter((agent) => {
      if (!agent.nextFollowUp) return false;
      const diff = differenceInDays(agent.nextFollowUp);
      return diff >= 0 && diff <= 7;
    }).length;

    return { dueToday, dueTomorrow, dueSoon };
  }, [agents]);

  const pageTheme =
    theme === "dark"
      ? "min-h-screen w-full max-w-full overflow-x-hidden bg-[radial-gradient(circle_at_top,_#26334f,_#09090b_58%)] p-3 text-zinc-100 md:p-6"
      : "min-h-screen w-full max-w-full overflow-x-hidden bg-zinc-100 p-3 text-zinc-950 md:p-6";
  const panelTheme = theme === "dark" ? "border-white/10 bg-zinc-900/85 text-zinc-100" : "bg-white";
  const mutedText = theme === "dark" ? "text-zinc-400" : "text-zinc-500";
  const inputTheme =
    theme === "dark"
      ? "border-white/10 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
      : "bg-white";
  const softPanel = theme === "dark" ? "border-white/10 bg-zinc-800/70" : "border-zinc-200 bg-zinc-50";
  const outlineTheme =
    theme === "dark"
      ? "border-white/10 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
      : "bg-white";

  const syncSavedState = () => {
    setSyncState("saved");
    setSyncMessage("Cloud Sync On");
  };

  const syncCloudError = (error: unknown) => {
    setSyncState("error");
    setSyncMessage(error instanceof Error ? error.message : "Cloud sync failed.");
  };

  const persistLeadRecord = async (lead: Lead) => {
    if (!supabase || !hasCloud) return;
    setSyncState("saving");
    setSyncMessage("Saving to cloud…");
    try {
      await saveLeadCloud(supabase, lead);
      syncSavedState();
    } catch (error) {
      syncCloudError(error);
    }
  };

  const persistAgentRecord = async (agent: Agent) => {
    if (!supabase || !hasCloud) return;
    setSyncState("saving");
    setSyncMessage("Saving to cloud…");
    try {
      await saveAgentCloud(supabase, agent);
      syncSavedState();
    } catch (error) {
      syncCloudError(error);
    }
  };

  const updateLead = (id: number, patch: Partial<Lead>) => {
    setLeads((curr) => {
      const next = curr.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead));
      const updated = next.find((lead) => lead.id === id);
      if (updated) {
        void persistLeadRecord(updated);
      }
      return next;
    });
  };

  const handleDrop = (stage: string) => {
    if (!draggedLeadId) return;
    const manualRank = nextSequence();
    updateLead(draggedLeadId, {
      stage,
      manualOverrideStage: stage,
      postponed: stage === "Postponed",
      status: `Manual override: ${stage}`,
      manualRank,
    });
    setDraggedLeadId(null);
  };

  const addLeadToStage = (stage: string) => {
    const address = newAddress.trim() || `New ${stage} Lead, Detroit, MI`;
    const existingLead = leads.find((lead) => normalizeAddress(lead.address) === normalizeAddress(address));

    if (existingLead) {
      setDuplicateWarning({ address, existing: existingLead.name });
      return;
    }

    const today = getTodayDate();
    const leadId = nextSequence();
    const newLead: Lead = {
      id: leadId,
      name: "New Owner",
      address,
      county: "Unknown",
      phone: "",
      email: "",
      stage,
      manualOverrideStage: stage,
      auctionDate: addDays(today, 12),
      score: stage === "Final Push" ? 10 : 6,
      status: "Not contacted",
      notes: "Manually added lead. Add more details here.",
      createdAt: today,
      nextFollowUp: today,
      followUps: [],
      calls: 0,
      texts: 0,
      lat: 42.3314,
      lng: -83.0458,
      source: "Manual",
      manualRank: nextSequence(),
      autoFollowUp: true,
      postponed: stage === "Postponed",
    };
    setLeads((curr) => [newLead, ...curr]);
    setSelectedLeadId(newLead.id);
    setNewAddress("");
    void persistLeadRecord(newLead);
  };

  const addPreLead = () => {
    const address = preQuickAdd.address.trim();
    if (!address) return;

    const existingLead = leads.find((lead) => normalizeAddress(lead.address) === normalizeAddress(address));

    if (existingLead) {
      setDuplicateWarning({ address, existing: existingLead.name });
      return;
    }

    const today = getTodayDate();
    const scheduledFollowUp = preQuickAdd.customFollowUp || (preQuickAdd.autoFollowUp ? addDays(today, 10) : "");
    const leadId = nextSequence();
    const newLead: Lead = {
      id: leadId,
      name: preQuickAdd.ownerName.trim() || "New Owner",
      address,
      county: preQuickAdd.county.trim() || "Unknown",
      phone: preQuickAdd.phone.trim(),
      email: preQuickAdd.email.trim(),
      stage: "Early Warning",
      manualOverrideStage: null,
      auctionDate: preQuickAdd.auctionDate || addDays(today, 14),
      score: 7,
      status: "Not contacted",
      notes: preQuickAdd.notes.trim() || "Manually added preforeclosure lead.",
      createdAt: today,
      nextFollowUp: scheduledFollowUp || today,
      followUps: scheduledFollowUp
        ? [{ id: `pre-${nextSequence()}`, date: scheduledFollowUp, label: "Scheduled", completed: false }]
        : [],
      calls: 0,
      texts: 0,
      lat: 42.3485,
      lng: -83.0912,
      source: "Manual",
      manualRank: 0,
      autoFollowUp: preQuickAdd.autoFollowUp,
      postponed: false,
    };

    setLeads((curr) => [newLead, ...curr]);
    setSelectedLeadId(newLead.id);
    setPreQuickAdd({
      ownerName: "",
      address: "",
      phone: "",
      email: "",
      county: "",
      auctionDate: "",
      notes: "",
      autoFollowUp: true,
      customFollowUp: "",
      showCalendar: false,
    });
    void persistLeadRecord(newLead);
  };

  const deleteLead = (id: number) => {
    const lead = leads.find((item) => item.id === id);
    if (!lead) return;

    setLeads((curr) => {
      const next = curr.filter((item) => item.id !== id);
      if (next.length > 0 && selectedLeadId === id) {
        setSelectedLeadId(next[0].id);
      }
      if (next.length === 0) {
        setSelectedLeadId(null);
      }
      return next;
    });
    setDeletedLeads((curr) => [lead, ...curr]);
    if (supabase && hasCloud) {
      setSyncState("saving");
      setSyncMessage("Deleting from cloud…");
      void archiveLeadCloud(supabase, lead)
        .then(() => syncSavedState())
        .catch((error) => syncCloudError(error));
    }
  };

  const applyCallResult = (result: string) => {
    if (!selectedLead) return;
    const today = getTodayDate();
    const nextDate = scheduleFollowUp(result, today);
    const remainingFollowUps = selectedLead.followUps.filter((dot) => dot.date !== selectedLead.nextFollowUp);
    const completedId = `done-${nextSequence()}`;
    const nextId = `next-${nextSequence()}`;

    updateLead(selectedLead.id, {
      status: result,
      nextFollowUp: nextDate,
      calls: selectedLead.calls + 1,
      followUps: [
        ...remainingFollowUps,
        { id: completedId, date: today, label: result, completed: true },
        ...(nextDate
          ? [{ id: nextId, date: nextDate, label: "Next follow-up", completed: false }]
          : []),
      ],
    });
  };

  const updateLeadTimelineDate = (dateValue: string) => {
    if (!selectedLead) return;
    const followUps = selectedLead.followUps.filter((dot) => dot.label !== "Custom follow-up");
    updateLead(selectedLead.id, {
      nextFollowUp: dateValue,
      followUps: [
        ...followUps,
        { id: `custom-${nextSequence()}`, date: dateValue, label: "Custom follow-up", completed: false },
      ],
    });
  };

  const updateAgent = (id: number, patch: Partial<Agent>) => {
    setAgents((curr) => {
      const next = curr.map((agent) => (agent.id === id ? { ...agent, ...patch } : agent));
      const updated = next.find((agent) => agent.id === id);
      if (updated) {
        void persistAgentRecord(updated);
      }
      return next;
    });
  };

  const openLeadEditor = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setLeadEditForm({
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      email: lead.email,
      county: lead.county,
      auctionDate: lead.auctionDate,
      nextFollowUp: lead.nextFollowUp ?? "",
      notes: lead.notes,
      postponed: lead.postponed,
    });
  };

  const saveLeadEdit = () => {
    if (!editingLeadId || !leadEditForm) return;
    updateLead(editingLeadId, {
      name: leadEditForm.name.trim() || "New Owner",
      address: leadEditForm.address.trim(),
      phone: leadEditForm.phone.trim(),
      email: leadEditForm.email.trim(),
      county: leadEditForm.county.trim() || "Unknown",
      auctionDate: leadEditForm.auctionDate || getTodayDate(),
      nextFollowUp: leadEditForm.nextFollowUp || null,
      notes: leadEditForm.notes.trim(),
      postponed: leadEditForm.postponed,
      source: "Edited",
    });
    setEditingLeadId(null);
    setLeadEditForm(null);
  };

  const importPreLeads = () => {
    const rows = splitImportRows(leadMassInput);
    if (rows.length === 0) return;

    let added = 0;
    let duplicates = 0;
    const review: string[] = [];
    const newLeads: Lead[] = [];
    const today = getTodayDate();

    rows.forEach((row, index) => {
      const parsed = parseLeadImportRow(row);
      if (!parsed.address) {
        review.push(`Row ${index + 1}: missing property address`);
        return;
      }

      const nextFollowUp = addDays(today, 10);
      const candidate: Lead = {
        id: nextSequence(),
        name: parsed.name,
        address: parsed.address,
        county: parsed.county,
        phone: parsed.phone,
        email: parsed.email,
        stage: "Early Warning",
        manualOverrideStage: null,
        auctionDate: parsed.auctionDate || addDays(today, 14),
        score: parsed.review.length > 0 ? 5 : 7,
        status: parsed.review.length > 0 ? "Needs review" : "Not contacted",
        notes:
          [parsed.notes, parsed.review.length > 0 ? `Needs review: ${parsed.review.join(", ")}` : ""]
            .filter(Boolean)
            .join(" | ") || "Mass imported preforeclosure lead.",
        createdAt: today,
        nextFollowUp,
        followUps: [
          { id: `pre-import-${nextSequence()}`, date: nextFollowUp, label: "Scheduled", completed: false },
        ],
        calls: 0,
        texts: 0,
        lat: 42.3314,
        lng: -83.0458,
        source: parsed.source,
        manualRank: 0,
        autoFollowUp: true,
        postponed: false,
      };

      if (dedupeLeads([...leads, ...newLeads], candidate)) {
        duplicates += 1;
        return;
      }

      if (parsed.review.length > 0) {
        review.push(`Row ${index + 1}: ${parsed.review.join(", ")}`);
      }

      newLeads.push(candidate);
      added += 1;
    });

    if (newLeads.length > 0) {
      setLeads((curr) => [...newLeads, ...curr]);
      setSelectedLeadId(newLeads[0].id);
      newLeads.forEach((lead) => {
        void persistLeadRecord(lead);
      });
    }

    setLeadImportSummary({ added, duplicates, review });
    setLeadMassInput("");
  };

  const logAgentFollowUp = (agent: Agent) => {
    const today = getTodayDate();
    const nextFollowUp = agent.autoFollowUp ? addDays(today, 10) : addDays(today, 3);
    updateAgent(agent.id, {
      lastContactedAt: today,
      nextFollowUp,
    });
  };

  const addAgent = () => {
    if (!agentQuickAdd.name.trim()) return;
    const today = getTodayDate();
    const scheduled = agentQuickAdd.customFollowUp || (agentQuickAdd.autoFollowUp ? addDays(today, 10) : null);
    const newAgent: Agent = {
      id: nextSequence(),
      name: agentQuickAdd.name.trim(),
      phone: agentQuickAdd.phone.trim(),
      email: agentQuickAdd.email.trim(),
      market: agentQuickAdd.market.trim() || "Unknown market",
      type: agentQuickAdd.type,
      nextFollowUp: scheduled,
      lastContactedAt: null,
      addedAt: today,
      notes: agentQuickAdd.notes.trim() || "New directory contact.",
      autoFollowUp: agentQuickAdd.autoFollowUp,
    };
    setAgents((curr) => [...curr, newAgent]);
    setAgentQuickAdd({
      name: "",
      phone: "",
      email: "",
      market: "",
      type: "Agent",
      notes: "",
      autoFollowUp: true,
      customFollowUp: "",
      showCalendar: false,
    });
    void persistAgentRecord(newAgent);
  };

  const openAgentEditor = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setAgentEditForm({
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      market: agent.market,
      type: agent.type,
      nextFollowUp: agent.nextFollowUp ?? "",
      notes: agent.notes,
      autoFollowUp: agent.autoFollowUp,
    });
  };

  const saveAgentEdit = () => {
    if (!editingAgentId || !agentEditForm) return;
    updateAgent(editingAgentId, {
      name: agentEditForm.name.trim() || "New Agent",
      phone: agentEditForm.phone.trim(),
      email: agentEditForm.email.trim(),
      market: agentEditForm.market.trim() || "Unknown market",
      type: agentEditForm.type,
      nextFollowUp: agentEditForm.nextFollowUp || null,
      notes: agentEditForm.notes.trim(),
      autoFollowUp: agentEditForm.autoFollowUp,
    });
    setEditingAgentId(null);
    setAgentEditForm(null);
  };

  const importAgents = () => {
    const rows = splitImportRows(agentMassInput);
    if (rows.length === 0) return;

    let added = 0;
    let duplicates = 0;
    const review: string[] = [];
    const newAgents: Agent[] = [];
    const today = getTodayDate();

    rows.forEach((row, index) => {
      const parsed = parseAgentImportRow(row);
      const candidate: Agent = {
        id: nextSequence(),
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email,
        market: parsed.market,
        type: parsed.type,
        nextFollowUp: parsed.explicitFollowUp || addDays(today, 10),
        lastContactedAt: null,
        addedAt: today,
        notes:
          [parsed.notes, parsed.review.length > 0 ? `Needs review: ${parsed.review.join(", ")}` : ""]
            .filter(Boolean)
            .join(" | ") || "Mass imported contact.",
        autoFollowUp: !parsed.explicitFollowUp,
      };

      if (dedupeAgents([...agents, ...newAgents], candidate)) {
        duplicates += 1;
        return;
      }

      if (parsed.review.length > 0) {
        review.push(`Row ${index + 1}: ${parsed.review.join(", ")}`);
      }

      newAgents.push(candidate);
      added += 1;
    });

    if (newAgents.length > 0) {
      setAgents((curr) => [...curr, ...newAgents]);
      newAgents.forEach((agent) => {
        void persistAgentRecord(agent);
      });
    }

    setAgentImportSummary({ added, duplicates, review });
    setAgentMassInput("");
  };

  const deleteAgent = (id: number) => {
    const agent = agents.find((item) => item.id === id);
    if (!agent) return;
    setAgents((curr) => curr.filter((item) => item.id !== id));
    setDeletedAgents((curr) => [agent, ...curr]);
    if (supabase && hasCloud) {
      setSyncState("saving");
      setSyncMessage("Deleting from cloud…");
      void archiveAgentCloud(supabase, agent)
        .then(() => syncSavedState())
        .catch((error) => syncCloudError(error));
    }
  };

  const restoreLead = (lead: Lead) => {
    setDeletedLeads((curr) => curr.filter((item) => item.id !== lead.id));
    setLeads((curr) => [lead, ...curr]);
    setSelectedLeadId(lead.id);
    if (supabase && hasCloud) {
      setSyncState("saving");
      setSyncMessage("Restoring from cloud…");
      void restoreLeadCloud(supabase, lead)
        .then(() => syncSavedState())
        .catch((error) => syncCloudError(error));
    }
  };

  const restoreAgent = (agent: Agent) => {
    setDeletedAgents((curr) => curr.filter((item) => item.id !== agent.id));
    setAgents((curr) => [agent, ...curr]);
    if (supabase && hasCloud) {
      setSyncState("saving");
      setSyncMessage("Restoring from cloud…");
      void restoreAgentCloud(supabase, agent)
        .then(() => syncSavedState())
        .catch((error) => syncCloudError(error));
    }
  };

  const timeline = selectedLead ? buildTimeline(selectedLead) : null;

  return (
    <div className={pageTheme}>
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden space-y-5">
        {duplicateWarning && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 text-red-600" />
                <div>
                  <div className="font-semibold text-red-800">Duplicate warning</div>
                  <div className="text-sm text-red-700">
                    {duplicateWarning.address} already matches {duplicateWarning.existing}. Review,
                    merge, or update the existing record instead of adding a duplicate.
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="rounded-2xl bg-white"
                onClick={() => setDuplicateWarning(null)}
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[32px] border p-4 shadow-sm md:p-5 ${panelTheme}`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                <Home className="h-4 w-4" />
                Unified CRM Command Center
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">
                Daily lead control, directory ops, and map-based territory visibility
              </h1>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Mobile-first workflow with urgency lanes, follow-up automation, an agent directory,
                and a free OpenStreetMap lead view.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-2 py-2 ${softPanel}`}>
                {[
                  { key: "agents", label: "Agent CRM", icon: Users },
                  { key: "pre", label: "Preforeclosure CRM", icon: Home },
                  { key: "map", label: "Map View", icon: Route },
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={mode === key ? "default" : "outline"}
                    className={`rounded-2xl ${mode === key ? "" : outlineTheme}`}
                    onClick={() => setMode(key as DashboardMode)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                className={`rounded-2xl ${outlineTheme}`}
                onClick={() => setTheme((curr) => (curr === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-3">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                mode === "agents"
                  ? "Search agents, market, notes..."
                  : mode === "map"
                    ? "Search lead names, addresses, counties..."
                    : "Search name, address, county, urgency..."
              }
              className={`h-12 rounded-2xl pl-10 ${inputTheme}`}
            />
          </div>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            syncState === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : syncState === "demo"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span className="font-semibold">
            {syncState === "demo" ? "Demo Mode — data may reset." : "Cloud Sync On"}
          </span>
          <span className="ml-2">
            {syncState === "loading" && "Loading cloud data…"}
            {syncState === "saving" && "Saving changes…"}
            {syncState === "saved" && (syncMessage ?? "All changes are stored in Supabase and sync live across devices.")}
            {syncState === "error" && (syncMessage ?? "Supabase is unavailable.")}
            {syncState === "demo" && (syncMessage ?? "Connect Supabase env vars to persist data across devices and deployments.")}
          </span>
        </div>

        {mode === "pre" && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <button type="button" onClick={() => setPreMetricFilter("total")} className="pressable text-left">
                <Metric
                  title="Total Leads"
                  value={leads.length}
                  sub="active records"
                  icon={Home}
                  dark={theme === "dark"}
                />
              </button>
              <button type="button" onClick={() => setPreMetricFilter("dueToday")} className="pressable text-left">
                <Metric title="Due Today" value={dailyQueue.length} sub="sticky priority queue" icon={Bell} hot />
              </button>
              <button type="button" onClick={() => setPreMetricFilter("auctionSoon")} className="pressable text-left">
                <Metric
                  title="Auctions < 7 Days"
                  value={leads.filter((lead) => {
                    const days = differenceInDays(lead.auctionDate);
                    return days >= 0 && days < 7;
                  }).length}
                  sub="highest urgency"
                  icon={Flame}
                  hot
                />
              </button>
              <button type="button" onClick={() => setPreMetricFilter("postponed")} className="pressable text-left">
                <Metric
                  title="Postponed"
                  value={leads.filter((lead) => getLeadStage(lead) === "Postponed").length}
                  sub="important reopen leads"
                  icon={CalendarDays}
                  dark={theme === "dark"}
                />
              </button>
            </div>

            {preMetricFilter && (
              <Card className={`rounded-3xl shadow-sm ${panelTheme}`}>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle>
                        {preMetricFilter === "total" && "All Leads"}
                        {preMetricFilter === "dueToday" && "Due Today"}
                        {preMetricFilter === "auctionSoon" && "Auctions < 7 Days"}
                        {preMetricFilter === "postponed" && "Postponed Leads"}
                      </CardTitle>
                      <p className={`mt-1 text-sm ${mutedText}`}>
                        Click a lead to jump to the detail panel.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className={`rounded-2xl ${outlineTheme}`}
                      onClick={() => setPreMetricFilter(null)}
                    >
                      Clear Filter
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <div className={`rounded-2xl border px-3 py-2 ${inputTheme}`}>
                      <label className={`mb-2 block text-xs uppercase tracking-[0.16em] ${mutedText}`}>
                        Sort
                      </label>
                      <select
                        value={preMetricSortBy}
                        onChange={(event) =>
                          setPreMetricSortBy(event.target.value as "alphabetical" | "recent")
                        }
                        className={`w-full bg-transparent text-sm outline-none ${theme === "dark" ? "text-zinc-100" : "text-zinc-950"}`}
                      >
                        <option value="alphabetical" className="text-zinc-950">
                          Alphabetically by owner name
                        </option>
                        <option value="recent" className="text-zinc-950">
                          Most recently added
                        </option>
                      </select>
                    </div>
                    <div className={`rounded-2xl border px-3 py-2 ${inputTheme}`}>
                      <label className={`mb-2 block text-xs uppercase tracking-[0.16em] ${mutedText}`}>
                        County
                      </label>
                      <select
                        value={preMetricCountyFilter}
                        onChange={(event) => setPreMetricCountyFilter(event.target.value)}
                        className={`w-full bg-transparent text-sm outline-none ${theme === "dark" ? "text-zinc-100" : "text-zinc-950"}`}
                      >
                        {preMetricCountyOptions.map((county) => (
                          <option key={county} value={county} className="text-zinc-950">
                            {county}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {preMetricLeads.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          leadDetailRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                        className={`pressable rounded-2xl border p-4 text-left transition hover:border-blue-400 ${
                          selectedLeadId === lead.id
                            ? "border-blue-500 ring-2 ring-blue-100"
                            : theme === "dark"
                              ? "border-white/10 bg-zinc-950/70"
                              : "bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{lead.name}</div>
                            <div className={`mt-1 text-sm ${mutedText}`}>{lead.address}</div>
                          </div>
                          <Badge className={stageStyle(getLeadStage(lead))}>{getLeadStage(lead)}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className={`rounded-full px-3 py-1 ${softPanel}`}>{lead.county}</span>
                          <span className={`rounded-full px-3 py-1 ${softPanel}`}>
                            Added {formatDate(lead.createdAt)}
                          </span>
                        </div>
                      </button>
                    ))}
                    {preMetricLeads.length === 0 && (
                      <div className={`rounded-2xl border border-dashed p-4 text-sm ${mutedText}`}>
                        No leads match the current metric and filters.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-5 xl:grid-cols-[290px,1fr,400px]">
              <div className="order-1 grid gap-5">
                <Card className={`rounded-3xl shadow-sm ${panelTheme}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Daily Queue
                    </CardTitle>
                    <p className={`text-sm ${mutedText}`}>Always visible priority follow-ups.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dailyQueue.length === 0 ? (
                      <div className={`text-sm ${mutedText}`}>Nothing due.</div>
                    ) : (
                      dailyQueue.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedLeadId(item.id);
                            leadDetailRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }}
                          className={`pressable w-full rounded-2xl border p-3 text-left transition hover:border-blue-400 ${
                            selectedLeadId === item.id
                              ? "border-blue-500 ring-2 ring-blue-100"
                              : theme === "dark"
                                ? "border-white/10 bg-zinc-950/70"
                                : "bg-white"
                          }`}
                        >
                          <div className="font-medium">{item.name}</div>
                          <div className={`text-xs ${mutedText}`}>
                            {getLeadStage(item)} • Score {item.score}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-xl px-2 py-1 text-xs ${softPanel}`}>
                              {dueLabel(item.nextFollowUp)}
                            </span>
                            <span className="rounded-xl bg-red-100 px-2 py-1 text-xs text-red-700">
                              {formatDate(item.auctionDate)}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className={`rounded-3xl shadow-sm ${panelTheme}`}>
                  <CardHeader>
                    <CardTitle>Preforeclosure Quick Add</CardTitle>
                    <p className={`text-sm ${mutedText}`}>
                      Add distressed-property leads with duplicate protection. Urgency updates
                      automatically from auction timing, follow-up timing, and lead score.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={preQuickAdd.ownerName}
                      onChange={(event) =>
                        setPreQuickAdd((curr) => ({ ...curr, ownerName: event.target.value }))
                      }
                      placeholder="Owner name"
                      className={`rounded-2xl ${inputTheme}`}
                    />
                    <Input
                      value={preQuickAdd.address}
                      onChange={(event) =>
                        setPreQuickAdd((curr) => ({ ...curr, address: event.target.value }))
                      }
                      placeholder="Property address"
                      className={`rounded-2xl ${inputTheme}`}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        value={preQuickAdd.phone}
                        onChange={(event) =>
                          setPreQuickAdd((curr) => ({ ...curr, phone: event.target.value }))
                        }
                        placeholder="Phone number"
                        className={`rounded-2xl ${inputTheme}`}
                      />
                      <Input
                        value={preQuickAdd.email}
                        onChange={(event) =>
                          setPreQuickAdd((curr) => ({ ...curr, email: event.target.value }))
                        }
                        placeholder="Email"
                        className={`rounded-2xl ${inputTheme}`}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        value={preQuickAdd.county}
                        onChange={(event) =>
                          setPreQuickAdd((curr) => ({ ...curr, county: event.target.value }))
                        }
                        placeholder="County"
                        className={`rounded-2xl ${inputTheme}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-2 text-sm">
                        <span className={`block text-xs font-semibold uppercase tracking-[0.16em] ${mutedText}`}>
                          Auction Date
                        </span>
                        <Input
                          type="date"
                          value={preQuickAdd.auctionDate}
                          onChange={(event) =>
                            setPreQuickAdd((curr) => ({ ...curr, auctionDate: event.target.value }))
                          }
                          className={`rounded-2xl ${inputTheme}`}
                        />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className={`block text-xs font-semibold uppercase tracking-[0.16em] ${mutedText}`}>
                          Next Follow-Up Date
                        </span>
                        <Input
                          type="date"
                          value={preQuickAdd.customFollowUp}
                          onChange={(event) =>
                            setPreQuickAdd((curr) => ({ ...curr, customFollowUp: event.target.value }))
                          }
                          className={`rounded-2xl ${inputTheme}`}
                        />
                      </label>
                    </div>
                    <div className={`rounded-2xl border p-3 ${softPanel}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">Auto follow-up every 10 days</div>
                          <div className={`text-xs ${mutedText}`}>
                            Keeps new leads on an automatic outreach cycle.
                          </div>
                        </div>
                        <Switch
                          checked={preQuickAdd.autoFollowUp}
                          onCheckedChange={(checked) =>
                            setPreQuickAdd((curr) => ({ ...curr, autoFollowUp: checked }))
                          }
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className={`rounded-2xl ${outlineTheme}`}
                          onClick={() =>
                            setPreQuickAdd((curr) => ({
                              ...curr,
                              showCalendar: !curr.showCalendar,
                            }))
                          }
                        >
                          <CalendarClock className="h-4 w-4" />
                          {preQuickAdd.customFollowUp
                            ? `Next Follow-Up Date ${formatDate(preQuickAdd.customFollowUp)}`
                            : "Reveal Next Follow-Up Date"}
                        </Button>
                        {preQuickAdd.showCalendar && (
                          <Input
                            type="date"
                            value={preQuickAdd.customFollowUp}
                            onChange={(event) =>
                              setPreQuickAdd((curr) => ({
                                ...curr,
                                customFollowUp: event.target.value,
                              }))
                            }
                            className={`w-full rounded-2xl ${inputTheme}`}
                          />
                        )}
                      </div>
                    </div>
                    <textarea
                      value={preQuickAdd.notes}
                      onChange={(event) =>
                        setPreQuickAdd((curr) => ({ ...curr, notes: event.target.value }))
                      }
                      className={`min-h-[110px] w-full rounded-2xl border p-3 text-sm ${inputTheme}`}
                      placeholder="Notes"
                    />
                    <Button className="w-full rounded-2xl" onClick={addPreLead}>
                      Add Lead
                    </Button>
                  </CardContent>
                </Card>

                <Card className={`rounded-3xl shadow-sm ${panelTheme}`}>
                  <CardHeader>
                    <CardTitle>Mass Quick Add Leads</CardTitle>
                    <p className={`text-sm ${mutedText}`}>
                      Paste one lead per line, CSV rows, or spreadsheet rows. Unclear fields are
                      moved into notes or flagged for review.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <textarea
                      value={leadMassInput}
                      onChange={(event) => setLeadMassInput(event.target.value)}
                      className={`min-h-[150px] w-full rounded-2xl border p-3 text-sm ${inputTheme}`}
                      placeholder="Anthony Reed, 313-555-4001, anthony@email.com, 1809 Clover Ave Detroit MI, Wayne County, 2026-05-03, Vacant house"
                    />
                    <Button className="w-full rounded-2xl" onClick={importPreLeads}>
                      Mass Quick Add
                    </Button>
                    {leadImportSummary && (
                      <div className={`rounded-2xl border p-3 text-sm ${softPanel}`}>
                        <div className="font-medium">
                          Added {leadImportSummary.added} • Duplicates skipped {leadImportSummary.duplicates}
                          {" "}• Needs review {leadImportSummary.review.length}
                        </div>
                        {leadImportSummary.review.length > 0 && (
                          <div className={`mt-2 space-y-1 text-xs ${mutedText}`}>
                            {leadImportSummary.review.slice(0, 5).map((item) => (
                              <div key={item}>{item}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {deletedLeads.length > 0 && (
                  <Card className={`rounded-3xl shadow-sm ${panelTheme}`}>
                    <CardHeader>
                      <CardTitle>Recently Deleted Leads</CardTitle>
                      <p className={`text-sm ${mutedText}`}>Restore archived leads from any device.</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {deletedLeads.slice(0, 5).map((lead) => (
                        <div key={lead.id} className={`rounded-2xl border p-3 ${softPanel}`}>
                          <div className="font-medium">{lead.name}</div>
                          <div className={`text-sm ${mutedText}`}>{lead.address}</div>
                          <Button
                            variant="outline"
                            className={`mt-3 w-full rounded-2xl ${outlineTheme}`}
                            onClick={() => restoreLead(lead)}
                          >
                            Restore Lead
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card className={`order-3 rounded-3xl shadow-sm xl:order-2 ${panelTheme}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Urgency pipeline</CardTitle>
                      <p className={`mt-1 text-sm ${mutedText}`}>
                        Auto-sorted by auction date, urgency band, and score. Dragging a card creates
                        a manual override.
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">Drag & drop ready</Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={newAddress}
                      onChange={(event) => setNewAddress(event.target.value)}
                      placeholder="Optional address for quick add / duplicate test"
                      className={`rounded-2xl ${inputTheme}`}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {groupedStageLeads.map(({ stage, items }) => (
                      <div
                        key={stage}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDrop(stage)}
                        className={`min-h-[220px] rounded-3xl border p-3 ${softPanel}`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="font-semibold">{stage}</div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-8 rounded-xl px-2 text-xs ${outlineTheme}`}
                              onClick={() => addLeadToStage(stage)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add
                            </Button>
                            <Badge className={stageStyle(stage)}>{items.length}</Badge>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {items.map((lead) => (
                            <button
                              key={lead.id}
                              draggable
                              onDragStart={() => setDraggedLeadId(lead.id)}
                              onClick={() => {
                                setSelectedLeadId(lead.id);
                                leadDetailRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              }}
                              className={`pressable w-full cursor-grab rounded-2xl border p-3 text-left transition hover:border-blue-400 hover:shadow-sm active:cursor-grabbing ${
                                selectedLeadId === lead.id
                                  ? "border-blue-500 ring-2 ring-blue-100"
                                  : theme === "dark"
                                    ? "border-white/10 bg-zinc-950/80"
                                    : "bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                  <div className="font-medium">{lead.name}</div>
                                  <div className="flex items-center gap-2">
                                    {lead.manualOverrideStage && (
                                      <Badge className="bg-indigo-100 text-indigo-700">
                                        Manual override
                                      </Badge>
                                    )}
                                    <Badge className="bg-zinc-100 text-zinc-700">{lead.score}</Badge>
                                  </div>
                                </div>
                              <div className={`mt-1 text-xs ${mutedText}`}>{lead.address}</div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className={`rounded-full px-2 py-1 ${softPanel}`}>
                                  <MapPin className="mr-1 inline h-3 w-3" />
                                  {lead.county}
                                </span>
                                <span className={`rounded-full px-2 py-1 ${softPanel}`}>
                                  <Clock className="mr-1 inline h-3 w-3" />
                                  {formatDate(lead.auctionDate)}
                                </span>
                              </div>
                            </button>
                          ))}
                          {items.length === 0 && (
                            <div className={`rounded-2xl border border-dashed p-4 text-sm ${mutedText}`}>
                              Drop leads here or tap Add.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div
                ref={leadDetailRef}
                className={`order-2 xl:order-3`}
              >
              <Card
                className={`rounded-3xl shadow-sm ring-2 ring-offset-2 ${
                  theme === "dark"
                    ? "ring-blue-500/70 ring-offset-zinc-950"
                    : "ring-blue-200 ring-offset-zinc-100"
                } xl:sticky xl:top-5 ${panelTheme}`}
              >
                {selectedLead && timeline ? (
                <>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{selectedLead.name}</CardTitle>
                      <p className={`mt-1 text-sm ${mutedText}`}>{selectedLead.address}</p>
                      <div className={`mt-4 rounded-3xl border p-4 ${softPanel}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">Follow-up timeline</div>
                            <div className={`text-xs ${mutedText}`}>
                              {timeline.daysToAuction >= 0
                                ? `${timeline.daysToAuction} days until auction`
                                : `Auction passed ${Math.abs(timeline.daysToAuction)} days ago`}
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">
                            Logged {formatDate(selectedLead.createdAt)}
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <div className="relative h-10">
                            <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-zinc-200" />
                            <div
                              className="absolute left-0 top-4 h-1 rounded-full bg-blue-700"
                              style={{ width: `${timeline.progress}%` }}
                            />
                            {timeline.points.map((point) => (
                              <div
                                key={point.id}
                                className="absolute top-0 -translate-x-1/2"
                                style={{ left: point.position }}
                              >
                                <div
                                  className={`mx-auto h-4 w-4 rounded-full border-2 ${
                                    point.completed
                                      ? "border-blue-700 bg-blue-700"
                                      : point.label === "Auction"
                                        ? "border-red-400 bg-red-100"
                                        : "border-zinc-300 bg-white"
                                  }`}
                                />
                                <div className="mt-1 text-center text-[10px] font-medium">
                                  {formatDate(point.date)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={stageStyle(getLeadStage(selectedLead))}>
                        {getLeadStage(selectedLead)}
                      </Badge>
                      {selectedLead.manualOverrideStage && (
                        <span className="text-xs font-medium text-indigo-500">Manual override</span>
                      )}
                      <Button
                        variant="outline"
                        className={`rounded-2xl ${outlineTheme}`}
                        onClick={() => openLeadEditor(selectedLead)}
                      >
                        Edit Info
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    {[
                      { label: "Phone", value: selectedLead.phone || "No phone" },
                      { label: "Email", value: selectedLead.email || "No email" },
                      { label: "Next Follow-Up", value: dueLabel(selectedLead.nextFollowUp) },
                      { label: "Calls", value: `${selectedLead.calls}` },
                      { label: "Status", value: selectedLead.status },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={
                          item.label === "Next Follow-Up" ? () => setLeadCalendarOpen((curr) => !curr) : undefined
                        }
                        className={`pressable rounded-2xl border p-3 text-left ${softPanel}`}
                      >
                        <div className={mutedText}>{item.label}</div>
                        <div className="font-medium">{item.value}</div>
                      </button>
                    ))}
                  </div>

                  {leadCalendarOpen && (
                    <Input
                      type="date"
                      value={selectedLead.nextFollowUp ?? ""}
                      onChange={(event) => updateLeadTimelineDate(event.target.value)}
                      className={`rounded-2xl ${inputTheme}`}
                    />
                  )}

                  <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
                    Auto scheduler: Interested → tomorrow, Maybe Interested → 2 days, no answer →
                    tomorrow, voicemail → 2 days, wrong number → skip trace.
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold">One-click call results</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Interested",
                        "Maybe Interested",
                        "No Answer",
                        "Left Voicemail",
                        "Wrong Number",
                        "Not Interested",
                        "Follow Up Later",
                      ].map((result) => (
                        <Button
                          key={result}
                          variant="outline"
                          className={`rounded-2xl ${outlineTheme}`}
                          onClick={() => applyCallResult(result)}
                        >
                          {result}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={selectedLead.notes}
                    onChange={(event) => updateLead(selectedLead.id, { notes: event.target.value })}
                    className={`min-h-[120px] w-full rounded-2xl border p-3 text-sm ${inputTheme}`}
                    placeholder="Add notes here..."
                  />

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {selectedLead.phone ? (
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className={`pressable inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm ${outlineTheme}`}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </a>
                    ) : (
                      <Button variant="outline" disabled className="rounded-2xl">
                        No Phone
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className={`rounded-2xl ${outlineTheme}`}
                      onClick={() =>
                        updateLead(selectedLead.id, {
                          texts: selectedLead.texts + 1,
                          status: "Texted",
                          nextFollowUp: addDays(getTodayDate(), 2),
                          followUps: [
                            ...selectedLead.followUps,
                            {
                              id: `text-${nextSequence()}`,
                              date: addDays(getTodayDate(), 2),
                              label: "Text follow-up",
                              completed: false,
                            },
                          ],
                        })
                      }
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Texted
                    </Button>
                    {selectedLead.email ? (
                      <a
                        href={`mailto:${selectedLead.email}`}
                        className={`pressable inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm ${outlineTheme}`}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </a>
                    ) : (
                      <Button variant="outline" disabled className="rounded-2xl">
                        No Email
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className={`rounded-2xl ${outlineTheme}`}
                      onClick={() =>
                        updateLead(selectedLead.id, {
                          nextFollowUp: getTodayDate(),
                          followUps: [
                            ...selectedLead.followUps,
                            {
                              id: `today-${nextSequence()}`,
                              date: getTodayDate(),
                              label: "Due today",
                              completed: false,
                            },
                          ],
                        })
                      }
                    >
                      Due Today
                    </Button>
                    <Button
                      variant="outline"
                      className={`rounded-2xl ${outlineTheme}`}
                      onClick={() => openLeadEditor(selectedLead)}
                    >
                      Edit Info
                    </Button>
                    <Button
                      className="rounded-2xl"
                      onClick={() =>
                        updateLead(selectedLead.id, {
                          status: "Saved",
                          nextFollowUp: addDays(getTodayDate(), 3),
                        })
                      }
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      className={`rounded-2xl sm:col-span-2 ${outlineTheme}`}
                      onClick={() => deleteLead(selectedLead.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Lead
                    </Button>
                  </div>
                </CardContent>
                </>
                ) : (
                  <CardContent className="p-6 text-sm">
                    <div className={mutedText}>
                      No preforeclosure lead selected yet. Add a lead or connect Supabase to begin syncing records.
                    </div>
                  </CardContent>
                )}
              </Card>
              </div>
            </div>
          </>
        )}

        {mode === "agents" && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <button type="button" onClick={() => setAgentMetricFilter("total")} className="pressable text-left">
                <Metric title="Total Agents" value={agents.length} sub="directory contacts" icon={Users} dark={theme === "dark"} />
              </button>
              <button type="button" onClick={() => setAgentMetricFilter("dueToday")} className="pressable text-left">
                <Metric title="Due Today" value={agentMetrics.dueToday} sub="needs touch today" icon={Bell} hot />
              </button>
              <button type="button" onClick={() => setAgentMetricFilter("dueTomorrow")} className="pressable text-left">
                <Metric title="Due Tomorrow" value={agentMetrics.dueTomorrow} sub="next-day follow-ups" icon={CalendarDays} dark={theme === "dark"} />
              </button>
              <button type="button" onClick={() => setAgentMetricFilter("dueSoon")} className="pressable text-left">
                <Metric title="Due Soon" value={agentMetrics.dueSoon} sub="within 7 days" icon={CalendarClock} dark={theme === "dark"} />
              </button>
              <button type="button" onClick={() => setAgentMetricFilter("auto10Day")} className="pressable text-left">
                <Metric title="Auto 10-Day" value={agents.filter((agent) => agent.autoFollowUp).length} sub="recurring check-ins" icon={ListChecks} dark={theme === "dark"} />
              </button>
            </div>

            {agentMetricFilter && (
              <Card className={`w-full max-w-full min-w-0 overflow-hidden rounded-3xl shadow-sm ${panelTheme}`}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle>
                        {agentMetricFilter === "total" && "All Agents"}
                        {agentMetricFilter === "dueToday" && "Agents Due Today"}
                        {agentMetricFilter === "dueTomorrow" && "Agents Due Tomorrow"}
                        {agentMetricFilter === "dueSoon" && "Agents Due Soon"}
                        {agentMetricFilter === "auto10Day" && "Agents on Auto 10-Day Follow-Up"}
                      </CardTitle>
                      <p className={`mt-1 text-sm ${mutedText}`}>
                        Filter the matching agent list by name order, recency, or county/market.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className={`rounded-2xl ${outlineTheme}`}
                      onClick={() => setAgentMetricFilter(null)}
                    >
                      Clear Filter
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 max-w-full gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <div className={`w-full max-w-full min-w-0 rounded-2xl border px-3 py-2 ${inputTheme}`}>
                      <label className={`mb-2 block text-xs uppercase tracking-[0.16em] ${mutedText}`}>
                        Sort
                      </label>
                      <select
                        value={agentMetricSortBy}
                        onChange={(event) =>
                          setAgentMetricSortBy(event.target.value as "alphabetical" | "recent")
                        }
                        className={`w-full min-w-0 max-w-full bg-transparent text-sm outline-none ${theme === "dark" ? "text-zinc-100" : "text-zinc-950"}`}
                      >
                        <option value="alphabetical" className="text-zinc-950">
                          Alphabetical by agent name
                        </option>
                        <option value="recent" className="text-zinc-950">
                          Most recently added
                        </option>
                      </select>
                    </div>
                    <div className={`w-full max-w-full min-w-0 rounded-2xl border px-3 py-2 ${inputTheme}`}>
                      <label className={`mb-2 block text-xs uppercase tracking-[0.16em] ${mutedText}`}>
                        County / market
                      </label>
                      <select
                        value={agentMetricMarketFilter}
                        onChange={(event) => setAgentMetricMarketFilter(event.target.value)}
                        className={`w-full min-w-0 max-w-full bg-transparent text-sm outline-none ${theme === "dark" ? "text-zinc-100" : "text-zinc-950"}`}
                      >
                        {agentMarkets.map((market) => (
                          <option key={market} value={market} className="text-zinc-950">
                            {market}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {agentMetricAgents.map((agent) => (
                      <Card
                        key={agent.id}
                        className={`min-w-0 overflow-hidden rounded-3xl shadow-sm ${theme === "dark" ? "border-white/10 bg-zinc-950/70" : "bg-white"}`}
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="space-y-2">
                            <div className="truncate text-lg font-semibold">{agent.name}</div>
                            <div className={`text-sm ${mutedText}`}>
                              {agent.type} • {agent.market}
                            </div>
                            <div className={`text-sm ${mutedText}`}>
                              {agent.phone || "No phone"} {agent.email ? `• ${agent.email}` : ""}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className={`rounded-full px-3 py-1 ${softPanel}`}>
                                Added {formatDate(agent.addedAt)}
                              </span>
                              <span className={`rounded-full px-3 py-1 ${softPanel}`}>
                                {dueLabel(agent.nextFollowUp)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                              <a
                                href={`tel:${agent.phone}`}
                                className={`pressable inline-flex w-full max-w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium ${outlineTheme}`}
                              >
                                <Phone className="h-4 w-4" />
                                Call
                              </a>
                              <a
                                href={`sms:${agent.phone}`}
                                className={`pressable inline-flex w-full max-w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium ${outlineTheme}`}
                              >
                                <Mail className="h-4 w-4" />
                                Text
                              </a>
                              {agent.email ? (
                                <a
                                  href={`mailto:${agent.email}`}
                                  className={`pressable inline-flex w-full max-w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium ${outlineTheme}`}
                                >
                                  <Mail className="h-4 w-4" />
                                  Email
                                </a>
                              ) : (
                                <Button variant="outline" disabled className="w-full rounded-2xl">
                                  No Email
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                className={`w-full rounded-2xl ${outlineTheme}`}
                                onClick={() => openAgentEditor(agent)}
                              >
                                Edit Info
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {agentMetricAgents.length === 0 && (
                      <div className={`rounded-2xl border border-dashed p-4 text-sm ${mutedText}`}>
                        No agents match the current metric and filters.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid w-full max-w-full min-w-0 gap-5 overflow-x-hidden xl:grid-cols-[minmax(0,270px),minmax(0,1fr)]">
              <div className="grid w-full max-w-full min-w-0 gap-5">
                <Card className={`w-full max-w-full min-w-0 overflow-hidden rounded-3xl shadow-sm ${panelTheme}`}>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle>Agent Quick Add</CardTitle>
                    <p className={`text-sm ${mutedText}`}>
                      Add directory contacts with reusable follow-up controls.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
                    <Input
                      value={agentQuickAdd.name}
                      onChange={(event) =>
                        setAgentQuickAdd((curr) => ({ ...curr, name: event.target.value }))
                      }
                      placeholder="Agent name"
                      className={`w-full min-w-0 max-w-full rounded-2xl ${inputTheme}`}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        value={agentQuickAdd.phone}
                        onChange={(event) =>
                          setAgentQuickAdd((curr) => ({ ...curr, phone: event.target.value }))
                        }
                        placeholder="Phone"
                        className={`w-full min-w-0 max-w-full rounded-2xl ${inputTheme}`}
                      />
                      <Input
                        value={agentQuickAdd.email}
                        onChange={(event) =>
                          setAgentQuickAdd((curr) => ({ ...curr, email: event.target.value }))
                        }
                        placeholder="Email"
                        className={`w-full min-w-0 max-w-full rounded-2xl ${inputTheme}`}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        value={agentQuickAdd.market}
                        onChange={(event) =>
                          setAgentQuickAdd((curr) => ({ ...curr, market: event.target.value }))
                        }
                        placeholder="County / market"
                        className={`w-full min-w-0 max-w-full rounded-2xl ${inputTheme}`}
                      />
                    </div>
                    <div className={`w-full max-w-full min-w-0 rounded-2xl border px-3 py-2 ${inputTheme}`}>
                      <label className={`mb-2 block text-xs uppercase tracking-[0.16em] ${mutedText}`}>
                        Contact type
                      </label>
                      <select
                        value={agentQuickAdd.type}
                        onChange={(event) =>
                          setAgentQuickAdd((curr) => ({ ...curr, type: event.target.value }))
                        }
                        className={`w-full min-w-0 max-w-full bg-transparent text-sm outline-none ${theme === "dark" ? "text-zinc-100" : "text-zinc-950"}`}
                      >
                        {["Agent", "Wholesaler", "Investor", "Lender"].map((option) => (
                          <option key={option} value={option} className="text-zinc-950">
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={`w-full max-w-full min-w-0 rounded-2xl border p-3 ${softPanel}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">Automatic follow-up every 10 days</div>
                          <div className={`text-xs ${mutedText}`}>
                            Great for relationship maintenance and referrals.
                          </div>
                        </div>
                        <Switch
                          checked={agentQuickAdd.autoFollowUp}
                          onCheckedChange={(checked) =>
                            setAgentQuickAdd((curr) => ({ ...curr, autoFollowUp: checked }))
                          }
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className={`rounded-2xl ${outlineTheme}`}
                          onClick={() =>
                            setAgentQuickAdd((curr) => ({
                              ...curr,
                              showCalendar: !curr.showCalendar,
                            }))
                          }
                        >
                          <CalendarClock className="h-4 w-4" />
                          {agentQuickAdd.customFollowUp
                            ? `Follow-up ${formatDate(agentQuickAdd.customFollowUp)}`
                            : "Custom follow-up"}
                        </Button>
                        {agentQuickAdd.showCalendar && (
                          <Input
                            type="date"
                            value={agentQuickAdd.customFollowUp}
                            onChange={(event) =>
                              setAgentQuickAdd((curr) => ({
                                ...curr,
                                customFollowUp: event.target.value,
                              }))
                            }
                            className={`w-full min-w-0 max-w-full rounded-2xl ${inputTheme}`}
                          />
                        )}
                      </div>
                    </div>
                    <textarea
                      value={agentQuickAdd.notes}
                      onChange={(event) =>
                        setAgentQuickAdd((curr) => ({ ...curr, notes: event.target.value }))
                      }
                      className={`min-h-[110px] w-full min-w-0 max-w-full rounded-2xl border p-3 text-sm ${inputTheme}`}
                      placeholder="Notes"
                    />
                    <Button className="w-full max-w-full rounded-2xl" onClick={addAgent}>
                      Add Agent
                    </Button>
                  </CardContent>
                </Card>

                <Card className={`w-full max-w-full min-w-0 overflow-hidden rounded-3xl shadow-sm ${panelTheme}`}>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle>Mass Quick Add Agents</CardTitle>
                    <p className={`text-sm ${mutedText}`}>
                      Paste one contact per line, CSV rows, or spreadsheet rows. Name, phone, email,
                      market, and notes are auto-detected with fallback review notes.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
                    <textarea
                      value={agentMassInput}
                      onChange={(event) => setAgentMassInput(event.target.value)}
                      className={`min-h-[150px] w-full min-w-0 max-w-full rounded-2xl border p-3 text-sm ${inputTheme}`}
                      placeholder="Sarah Klein, 586-555-2121, sarah@macombhomes.com, Macomb County, Sends fixer listings"
                    />
                    <Button className="w-full max-w-full rounded-2xl" onClick={importAgents}>
                      Mass Quick Add
                    </Button>
                    {agentImportSummary && (
                      <div className={`rounded-2xl border p-3 text-sm ${softPanel}`}>
                        <div className="font-medium">
                          Added {agentImportSummary.added} • Duplicates skipped {agentImportSummary.duplicates}
                          {" "}• Needs review {agentImportSummary.review.length}
                        </div>
                        {agentImportSummary.review.length > 0 && (
                          <div className={`mt-2 space-y-1 text-xs ${mutedText}`}>
                            {agentImportSummary.review.slice(0, 5).map((item) => (
                              <div key={item}>{item}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {deletedAgents.length > 0 && (
                  <Card className={`w-full max-w-full min-w-0 overflow-hidden rounded-3xl shadow-sm ${panelTheme}`}>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle>Recently Deleted Agents</CardTitle>
                      <p className={`text-sm ${mutedText}`}>Restore archived contacts with one tap.</p>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
                      {deletedAgents.slice(0, 5).map((agent) => (
                        <div key={agent.id} className={`rounded-2xl border p-3 ${softPanel}`}>
                          <div className="font-medium">{agent.name}</div>
                          <div className={`text-sm ${mutedText}`}>{agent.market}</div>
                          <Button
                            variant="outline"
                            className={`mt-3 w-full rounded-2xl ${outlineTheme}`}
                            onClick={() => restoreAgent(agent)}
                          >
                            Restore Agent
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

              </div>

              <Card className={`w-full max-w-full min-w-0 overflow-hidden rounded-3xl shadow-sm ${panelTheme}`}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <CardTitle>Filtered agent list</CardTitle>
                      <p className={`mt-1 text-sm ${mutedText}`}>
                        Sort, filter, jump, and work your contacts from one mobile-friendly list.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 max-w-full gap-2 sm:grid-cols-2">
                      <div className={`w-full max-w-full min-w-0 rounded-2xl border px-3 py-2 ${inputTheme}`}>
                        <label className={`mb-2 block text-xs uppercase tracking-[0.16em] ${mutedText}`}>
                          Sort
                        </label>
                        <select
                          value={agentSortBy}
                          onChange={(event) =>
                            setAgentSortBy(
                              event.target.value as "alphabetical" | "recent" | "market",
                            )
                          }
                          className={`w-full bg-transparent text-sm outline-none ${theme === "dark" ? "text-zinc-100" : "text-zinc-950"}`}
                        >
                          <option value="alphabetical" className="text-zinc-950">
                            Alphabetical
                          </option>
                          <option value="recent" className="text-zinc-950">
                            Most recent
                          </option>
                          <option value="market" className="text-zinc-950">
                            County / Market
                          </option>
                        </select>
                      </div>
                      <div className={`w-full max-w-full min-w-0 rounded-2xl border px-3 py-2 ${inputTheme}`}>
                        <label className={`mb-2 block text-xs uppercase tracking-[0.16em] ${mutedText}`}>
                          Market
                        </label>
                        <select
                          value={agentMarketFilter}
                          onChange={(event) => setAgentMarketFilter(event.target.value)}
                          className={`w-full bg-transparent text-sm outline-none ${theme === "dark" ? "text-zinc-100" : "text-zinc-950"}`}
                        >
                          {agentMarkets.map((market) => (
                            <option key={market} value={market} className="text-zinc-950">
                              {market}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  {primaryAgentGroups.length > 0 && (
                    <div className="mb-5 flex w-full max-w-full gap-2 overflow-x-auto pb-2">
                      {primaryAgentGroups.map((group) => (
                        <Button
                          key={group.id}
                          variant="outline"
                          className={`h-9 shrink-0 rounded-2xl px-3 ${outlineTheme}`}
                          onClick={() =>
                            document
                              .getElementById(group.id)
                              ?.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        >
                          {group.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="min-w-0 space-y-6">
                    {primaryAgentGroups.map((group) => (
                        <section key={group.id} id={group.id} className="w-full max-w-full min-w-0 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold">{group.label}</div>
                            <div className={`h-px flex-1 ${theme === "dark" ? "bg-white/10" : "bg-zinc-200"}`} />
                          </div>
                          <div className="grid gap-3">
                            {group.items.map((agent) => (
                              <Card key={agent.id} className={`min-w-0 overflow-hidden rounded-3xl shadow-sm ${theme === "dark" ? "border-white/10 bg-zinc-950/70" : "bg-white"}`}>
                                <CardContent className="p-4 sm:p-5">
                                  <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="min-w-0 space-y-2">
                                      <div className="truncate text-lg font-semibold">{agent.name}</div>
                                      <div className={`text-sm ${mutedText}`}>
                                        {agent.type} • {agent.market}
                                      </div>
                                      <div className={`break-words text-sm ${mutedText}`}>
                                        {agent.phone || "No phone"} {agent.email ? `• ${agent.email}` : ""}
                                      </div>
                                      <div className="break-words text-sm">{agent.notes}</div>
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        <span className={`rounded-full px-3 py-1 ${softPanel}`}>
                                          Added {formatDate(agent.addedAt)}
                                        </span>
                                        <button
                                          type="button"
                                          className={`pressable rounded-full px-3 py-1 ${softPanel}`}
                                          onClick={() => logAgentFollowUp(agent)}
                                        >
                                          Due {dueLabel(agent.nextFollowUp)}
                                        </button>
                                        <span className={`rounded-full px-3 py-1 ${softPanel}`}>
                                          Last contacted {formatDate(agent.lastContactedAt)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="grid w-full max-w-full min-w-0 shrink-0 grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
                                      <Badge
                                        className={
                                          agent.nextFollowUp && differenceInDays(agent.nextFollowUp) <= 0
                                            ? "bg-red-100 text-red-700"
                                            : "bg-blue-100 text-blue-700"
                                        }
                                      >
                                        {dueLabel(agent.nextFollowUp)}
                                      </Badge>
                                      <a
                                        href={`tel:${agent.phone}`}
                                        className={`pressable inline-flex w-full max-w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium sm:w-auto ${outlineTheme}`}
                                      >
                                        <Phone className="h-4 w-4" />
                                        Call
                                      </a>
                                      <a
                                        href={`sms:${agent.phone}`}
                                        className={`pressable inline-flex w-full max-w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium sm:w-auto ${outlineTheme}`}
                                      >
                                        <Mail className="h-4 w-4" />
                                        Text
                                      </a>
                                      {agent.email ? (
                                        <a
                                          href={`mailto:${agent.email}`}
                                          className={`pressable inline-flex w-full max-w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium sm:w-auto ${outlineTheme}`}
                                        >
                                          <Mail className="h-4 w-4" />
                                          Email
                                        </a>
                                      ) : (
                                        <Button variant="outline" disabled className="w-full rounded-2xl sm:w-auto">
                                          No Email
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        className={`w-full max-w-full rounded-2xl sm:w-auto ${outlineTheme}`}
                                        onClick={() => openAgentEditor(agent)}
                                      >
                                        Edit Info
                                      </Button>
                                      <Button className="w-full max-w-full rounded-2xl sm:w-auto" onClick={() => logAgentFollowUp(agent)}>
                                        Log Follow-Up
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className={`w-full max-w-full rounded-2xl sm:w-auto ${outlineTheme}`}
                                        onClick={() => deleteAgent(agent.id)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </section>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {mode === "map" && (
          <MapView leads={filteredLeads} dark={theme === "dark"} />
        )}

        {leadEditForm && editingLeadId && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <Card className={`w-full max-w-2xl rounded-3xl shadow-xl ${panelTheme}`}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Edit Lead Info</CardTitle>
                  <Button
                    variant="outline"
                    className={`rounded-2xl ${outlineTheme}`}
                    onClick={() => {
                      setEditingLeadId(null);
                      setLeadEditForm(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={leadEditForm.name}
                  onChange={(event) => setLeadEditForm((curr) => curr ? { ...curr, name: event.target.value } : curr)}
                  placeholder="Owner name"
                  className={`rounded-2xl ${inputTheme}`}
                />
                <Input
                  value={leadEditForm.phone}
                  onChange={(event) => setLeadEditForm((curr) => curr ? { ...curr, phone: event.target.value } : curr)}
                  placeholder="Phone"
                  className={`rounded-2xl ${inputTheme}`}
                />
                <div className="sm:col-span-2">
                  <Input
                    value={leadEditForm.address}
                    onChange={(event) => setLeadEditForm((curr) => curr ? { ...curr, address: event.target.value } : curr)}
                    placeholder="Property address"
                    className={`rounded-2xl ${inputTheme}`}
                  />
                </div>
                <Input
                  value={leadEditForm.email}
                  onChange={(event) => setLeadEditForm((curr) => curr ? { ...curr, email: event.target.value } : curr)}
                  placeholder="Email"
                  className={`rounded-2xl ${inputTheme}`}
                />
                <Input
                  value={leadEditForm.county}
                  onChange={(event) => setLeadEditForm((curr) => curr ? { ...curr, county: event.target.value } : curr)}
                  placeholder="County"
                  className={`rounded-2xl ${inputTheme}`}
                />
                <Input
                  type="date"
                  value={leadEditForm.auctionDate}
                  onChange={(event) => setLeadEditForm((curr) => curr ? { ...curr, auctionDate: event.target.value } : curr)}
                  className={`rounded-2xl ${inputTheme}`}
                />
                <Input
                  type="date"
                  value={leadEditForm.nextFollowUp}
                  onChange={(event) => setLeadEditForm((curr) => curr ? { ...curr, nextFollowUp: event.target.value } : curr)}
                  className={`rounded-2xl ${inputTheme}`}
                />
                <label className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm ${softPanel}`}>
                  <Switch
                    checked={leadEditForm.postponed}
                    onCheckedChange={(checked) => setLeadEditForm((curr) => curr ? { ...curr, postponed: checked } : curr)}
                  />
                  Mark as postponed
                </label>
                <div className="sm:col-span-2">
                  <textarea
                    value={leadEditForm.notes}
                    onChange={(event) => setLeadEditForm((curr) => curr ? { ...curr, notes: event.target.value } : curr)}
                    className={`min-h-[120px] w-full rounded-2xl border p-3 text-sm ${inputTheme}`}
                    placeholder="Notes"
                  />
                </div>
                <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">
                  <Button className="w-full rounded-2xl" onClick={saveLeadEdit}>
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className={`w-full rounded-2xl ${outlineTheme}`}
                    onClick={() => {
                      setEditingLeadId(null);
                      setLeadEditForm(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {agentEditForm && editingAgentId && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <Card className={`w-full max-w-2xl rounded-3xl shadow-xl ${panelTheme}`}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Edit Agent Info</CardTitle>
                  <Button
                    variant="outline"
                    className={`rounded-2xl ${outlineTheme}`}
                    onClick={() => {
                      setEditingAgentId(null);
                      setAgentEditForm(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={agentEditForm.name}
                  onChange={(event) => setAgentEditForm((curr) => curr ? { ...curr, name: event.target.value } : curr)}
                  placeholder="Agent name"
                  className={`rounded-2xl ${inputTheme}`}
                />
                <Input
                  value={agentEditForm.phone}
                  onChange={(event) => setAgentEditForm((curr) => curr ? { ...curr, phone: event.target.value } : curr)}
                  placeholder="Phone"
                  className={`rounded-2xl ${inputTheme}`}
                />
                <Input
                  value={agentEditForm.email}
                  onChange={(event) => setAgentEditForm((curr) => curr ? { ...curr, email: event.target.value } : curr)}
                  placeholder="Email"
                  className={`rounded-2xl ${inputTheme}`}
                />
                <Input
                  value={agentEditForm.market}
                  onChange={(event) => setAgentEditForm((curr) => curr ? { ...curr, market: event.target.value } : curr)}
                  placeholder="County / market"
                  className={`rounded-2xl ${inputTheme}`}
                />
                <div className={`rounded-2xl border px-3 py-2 ${inputTheme}`}>
                  <label className={`mb-2 block text-xs uppercase tracking-[0.16em] ${mutedText}`}>
                    Contact type
                  </label>
                  <select
                    value={agentEditForm.type}
                    onChange={(event) => setAgentEditForm((curr) => curr ? { ...curr, type: event.target.value } : curr)}
                    className={`w-full bg-transparent text-sm outline-none ${theme === "dark" ? "text-zinc-100" : "text-zinc-950"}`}
                  >
                    {["Agent", "Wholesaler", "Investor", "Lender"].map((option) => (
                      <option key={option} value={option} className="text-zinc-950">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="date"
                  value={agentEditForm.nextFollowUp}
                  onChange={(event) => setAgentEditForm((curr) => curr ? { ...curr, nextFollowUp: event.target.value } : curr)}
                  className={`rounded-2xl ${inputTheme}`}
                />
                <label className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm ${softPanel}`}>
                  <Switch
                    checked={agentEditForm.autoFollowUp}
                    onCheckedChange={(checked) => setAgentEditForm((curr) => curr ? { ...curr, autoFollowUp: checked } : curr)}
                  />
                  Automatic 10-day follow-up
                </label>
                <div className="sm:col-span-2">
                  <textarea
                    value={agentEditForm.notes}
                    onChange={(event) => setAgentEditForm((curr) => curr ? { ...curr, notes: event.target.value } : curr)}
                    className={`min-h-[120px] w-full rounded-2xl border p-3 text-sm ${inputTheme}`}
                    placeholder="Notes"
                  />
                </div>
                <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">
                  <Button className="w-full rounded-2xl" onClick={saveAgentEdit}>
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className={`w-full rounded-2xl ${outlineTheme}`}
                    onClick={() => {
                      setEditingAgentId(null);
                      setAgentEditForm(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
