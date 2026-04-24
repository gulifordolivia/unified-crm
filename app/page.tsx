"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Phone,
  Mail,
  Bell,
  CalendarDays,
  Flame,
  Home,
  FileWarning,
  MapPin,
  Clock,
  Plus,
  ListChecks,
  PanelRightOpen,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

type Lead = {
  id: number;
  name: string;
  address: string;
  county: string;
  phone: string;
  stage: string;
  auction: string;
  score: number;
  status: string;
  notes: string;
  next: string;
  calls: number;
  texts: number;
};

type Agent = {
  id: number;
  name: string;
  market: string;
  type: string;
  next: string;
  notes: string;
};

type DuplicateWarning = {
  address: string;
  existing: string;
};

type MetricProps = {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  sub: string;
  hot?: boolean;
};

const startingLeads: Lead[] = [
  {
    id: 1,
    name: "Anthony Reed",
    address: "1809 Clover Ave, Detroit, MI",
    county: "Wayne",
    phone: "313-555-4001",
    stage: "Final Push",
    auction: "2 days",
    score: 14,
    status: "No answer",
    notes: "Vacant, tax delinquent, absentee owner. Needs quick follow-up.",
    next: "Today",
    calls: 2,
    texts: 1,
  },
  {
    id: 2,
    name: "Brenda Cole",
    address: "794 E 99th St, Detroit, MI",
    county: "Wayne",
    phone: "313-555-2202",
    stage: "Rising Urgency",
    auction: "16 days",
    score: 8,
    status: "Interested",
    notes: "Owner asked for callback. Possible offer opportunity.",
    next: "Tomorrow",
    calls: 1,
    texts: 0,
  },
  {
    id: 3,
    name: "Darnell Price",
    address: "22114 Harper Blvd, Roseville, MI",
    county: "Macomb",
    phone: "586-555-9090",
    stage: "Postponed",
    auction: "Postponed",
    score: 15,
    status: "Left voicemail",
    notes: "Postponed once already. Very important follow-up.",
    next: "Today",
    calls: 4,
    texts: 2,
  },
  {
    id: 4,
    name: "Helen Morris",
    address: "40409 Birch Run, Sterling Heights, MI",
    county: "Macomb",
    phone: "586-555-0044",
    stage: "Expired",
    auction: "Passed",
    score: 3,
    status: "Could not reach",
    notes: "Auction passed. Keep only if updated.",
    next: "None",
    calls: 3,
    texts: 2,
  },
];

const agents: Agent[] = [
  {
    id: 1,
    name: "Sarah Klein",
    market: "Macomb County",
    type: "Agent",
    next: "Today",
    notes: "Sends fixer listings occasionally.",
  },
  {
    id: 2,
    name: "Mike Torres",
    market: "Detroit",
    type: "Wholesaler",
    next: "Overdue",
    notes: "Has buyers for east side deals.",
  },
  {
    id: 3,
    name: "Julia Benton",
    market: "Oakland County",
    type: "Agent",
    next: "10 days",
    notes: "Retail-heavy agent.",
  },
];

const stages = [
  "Final Push",
  "Critical",
  "High Urgency",
  "Rising Urgency",
  "Low Urgency",
  "Postponed",
  "Expired",
];

function stageStyle(stage: string) {
  if (stage === "Final Push") return "bg-red-100 text-red-700";
  if (stage === "Critical") return "bg-orange-100 text-orange-700";
  if (stage === "High Urgency") return "bg-amber-100 text-amber-800";
  if (stage === "Postponed") return "bg-purple-100 text-purple-700";
  if (stage === "Rising Urgency") return "bg-blue-100 text-blue-700";
  if (stage === "Low Urgency") return "bg-emerald-100 text-emerald-700";
  if (stage === "Expired") return "bg-zinc-200 text-zinc-700";
  return "bg-zinc-100 text-zinc-700";
}

function Metric({ title, value, icon: Icon, sub, hot }: MetricProps) {
  return (
    <Card className={`rounded-3xl shadow-sm ${hot ? "border-red-200 bg-red-50" : "bg-white"}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-500">{title}</div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
            <div className="mt-1 text-xs text-zinc-500">{sub}</div>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function scheduleFollowUp(status: string) {
  if (status === "Interested") return "Tomorrow";
  if (status === "Left Voicemail") return "+2 days";
  if (status === "No Answer") return "+1 day";
  if (status === "Wrong Number") return "Skiptrace";
  if (status === "Not Interested") return "None";
  return "+3 days";
}

export default function OptimizedUnifiedCrmPreview() {
  const [mode, setMode] = useState<"pre" | "agents">("pre");
  const [leads, setLeads] = useState<Lead[]>(startingLeads);
  const [selected, setSelected] = useState<Lead>(startingLeads[0]);
  const [search, setSearch] = useState("");
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [newAddress, setNewAddress] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((lead) =>
      [lead.name, lead.address, lead.county, lead.stage].join(" ").toLowerCase().includes(q),
    );
  }, [search, leads]);

  const dailyQueue = leads
    .filter((lead) => lead.next === "Today" || lead.next === "Overdue")
    .sort((a, b) => b.score - a.score);

  const updateLead = (id: number, patch: Partial<Lead>) => {
    setLeads((curr) => curr.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
    setSelected((curr) => (curr.id === id ? { ...curr, ...patch } : curr));
  };

  const handleDrop = (stage: string) => {
    if (!draggedLeadId) return;
    updateLead(draggedLeadId, { stage, status: `Moved to ${stage}` });
    setDraggedLeadId(null);
  };

  const addLeadToStage = (stage: string) => {
    const address = newAddress.trim() || `New ${stage} Lead, Detroit, MI`;
    const normalizedAddress = address.toLowerCase().replace(/\s+/g, " ").trim();
    const existingLead = leads.find(
      (lead) => lead.address.toLowerCase().replace(/\s+/g, " ").trim() === normalizedAddress,
    );

    if (existingLead) {
      setDuplicateWarning({ address, existing: existingLead.name });
      return;
    }

    const newLead: Lead = {
      id: Date.now(),
      name: "New Owner",
      address,
      county: "Unknown",
      phone: "",
      stage,
      auction: "Unknown",
      score: stage === "Final Push" ? 10 : 4,
      status: "Not contacted",
      notes: "Manually added lead. Add more details here.",
      next: "Today",
      calls: 0,
      texts: 0,
    };
    setLeads((curr) => [newLead, ...curr]);
    setSelected(newLead);
    setNewAddress("");
  };

  const applyCallResult = (result: string) => {
    const next = scheduleFollowUp(result);
    const calls = selected.calls + 1;
    updateLead(selected.id, { status: result, next, calls });
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-3 text-zinc-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
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
                    {duplicateWarning.address} already appears to match{" "}
                    {duplicateWarning.existing}. Choose skip, merge, or update existing in the
                    real app.
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
          className="rounded-[32px] border bg-white p-4 shadow-sm md:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Home className="h-4 w-4" /> Unified CRM Command Center
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">
                Daily lead control, built for speed
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Now with drag/drop stages, automatic follow-up scheduling, duplicate alerts, and a
                sticky daily queue.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl border bg-zinc-50 px-3 py-2">
                <span className={`text-sm ${mode === "agents" ? "font-semibold" : "text-zinc-500"}`}>
                  Agent CRM
                </span>
                <Switch checked={mode === "pre"} onCheckedChange={(value) => setMode(value ? "pre" : "agents")} />
                <span className={`text-sm ${mode === "pre" ? "font-semibold" : "text-zinc-500"}`}>
                  Preforeclosure CRM
                </span>
              </div>
              <Button className="rounded-2xl">
                <Plus className="mr-2 h-4 w-4" />
                Quick Add
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-3 md:grid-cols-[1fr,190px,190px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, address, county, stage..."
              className="h-12 rounded-2xl bg-white pl-10"
            />
          </div>
          <Button variant="outline" className="h-12 rounded-2xl bg-white">
            <ListChecks className="mr-2 h-4 w-4" />
            Today Queue
          </Button>
          <Button variant="outline" className="h-12 rounded-2xl bg-white">
            <PanelRightOpen className="mr-2 h-4 w-4" />
            Focus View
          </Button>
        </div>

        {mode === "pre" ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Metric title="Total Leads" value={leads.length} sub="active records" icon={Home} />
              <Metric
                title="Due Today"
                value={dailyQueue.length}
                sub="sticky priority queue"
                icon={Bell}
                hot
              />
              <Metric title="Auction ≤ 7 Days" value="6" sub="highest urgency" icon={Flame} hot />
              <Metric
                title="Postponed"
                value={leads.filter((lead) => lead.stage === "Postponed").length}
                sub="important reopen leads"
                icon={CalendarDays}
              />
              <Metric
                title="Duplicates Blocked"
                value={duplicateWarning ? 1 : 11}
                sub="clean database"
                icon={FileWarning}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[250px,1fr,390px]">
              <Card className="sticky top-5 h-fit rounded-3xl bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Daily Queue
                  </CardTitle>
                  <p className="text-sm text-zinc-500">Always visible priority follow-ups.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dailyQueue.length === 0 ? (
                    <div className="text-sm text-zinc-500">Nothing due.</div>
                  ) : (
                    dailyQueue.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className={`w-full rounded-2xl border p-3 text-left hover:border-blue-400 ${
                          selected.id === item.id ? "border-blue-500" : ""
                        }`}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-zinc-500">
                          {item.stage} • Score {item.score}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <a
                            href={`tel:${item.phone}`}
                            className="rounded-xl bg-zinc-100 px-2 py-1 text-xs"
                          >
                            Call
                          </a>
                          <span className="rounded-xl bg-red-100 px-2 py-1 text-xs text-red-700">
                            {item.next}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Urgency pipeline</CardTitle>
                      <p className="mt-1 text-sm text-zinc-500">
                        Drag cards between categories. Each category has a manual add button.
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">Drag & drop ready</Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={newAddress}
                      onChange={(event) => setNewAddress(event.target.value)}
                      placeholder="Optional address for quick add / duplicate test"
                      className="rounded-2xl"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {stages.map((stage) => {
                      const stageLeads = filtered.filter((lead) => lead.stage === stage);
                      return (
                        <div
                          key={stage}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleDrop(stage)}
                          className="min-h-[180px] rounded-3xl border bg-zinc-50 p-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="font-semibold">{stage}</div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl px-2 text-xs"
                                onClick={() => addLeadToStage(stage)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Add
                              </Button>
                              <Badge className={stageStyle(stage)}>{stageLeads.length}</Badge>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {stageLeads.map((lead) => (
                              <button
                                key={lead.id}
                                draggable
                                onDragStart={() => setDraggedLeadId(lead.id)}
                                onClick={() => setSelected(lead)}
                                className={`w-full cursor-grab rounded-2xl border bg-white p-3 text-left transition hover:border-blue-400 hover:shadow-sm active:cursor-grabbing ${
                                  selected.id === lead.id ? "border-blue-500 ring-2 ring-blue-100" : ""
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-medium">{lead.name}</div>
                                  <Badge className="bg-zinc-100 text-zinc-700">{lead.score}</Badge>
                                </div>
                                <div className="mt-1 text-xs text-zinc-500">{lead.address}</div>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <span className="rounded-full bg-zinc-100 px-2 py-1">
                                    <MapPin className="mr-1 inline h-3 w-3" />
                                    {lead.county}
                                  </span>
                                  <span className="rounded-full bg-zinc-100 px-2 py-1">
                                    <Clock className="mr-1 inline h-3 w-3" />
                                    {lead.auction}
                                  </span>
                                </div>
                              </button>
                            ))}
                            {stageLeads.length === 0 && (
                              <div className="rounded-2xl border border-dashed p-4 text-sm text-zinc-500">
                                Drop leads here or tap Add.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="sticky top-5 h-fit rounded-3xl bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{selected.name}</CardTitle>
                      <p className="mt-1 text-sm text-zinc-500">{selected.address}</p>
                    </div>
                    <Badge className={stageStyle(selected.stage)}>{selected.stage}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border p-3">
                      <div className="text-zinc-500">Phone</div>
                      <div className="font-medium">{selected.phone || "No phone"}</div>
                    </div>
                    <div className="rounded-2xl border p-3">
                      <div className="text-zinc-500">Next Follow-Up</div>
                      <div className="font-medium">{selected.next}</div>
                    </div>
                    <div className="rounded-2xl border p-3">
                      <div className="text-zinc-500">Calls</div>
                      <div className="font-medium">{selected.calls}</div>
                    </div>
                    <div className="rounded-2xl border p-3">
                      <div className="text-zinc-500">Status</div>
                      <div className="font-medium">{selected.status}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
                    Auto scheduler: Interested → tomorrow, no answer → tomorrow, voicemail → 2
                    days, wrong number → skiptrace.
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold">One-click call results</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Interested",
                        "No Answer",
                        "Left Voicemail",
                        "Wrong Number",
                        "Not Interested",
                        "Follow Up Later",
                      ].map((result) => (
                        <Button
                          key={result}
                          variant="outline"
                          className="rounded-2xl"
                          onClick={() => applyCallResult(result)}
                        >
                          {result}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={selected.notes}
                    onChange={(event) => updateLead(selected.id, { notes: event.target.value })}
                    className="min-h-[120px] w-full rounded-2xl border p-3 text-sm"
                    placeholder="Add notes here..."
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {selected.phone ? (
                      <a
                        href={`tel:${selected.phone}`}
                        className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm"
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
                      className="rounded-2xl"
                      onClick={() =>
                        updateLead(selected.id, {
                          texts: selected.texts + 1,
                          status: "Texted",
                          next: "+2 days",
                        })
                      }
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Texted
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => updateLead(selected.id, { next: "Today" })}
                    >
                      Due Today
                    </Button>
                    <Button
                      className="rounded-2xl"
                      onClick={() => updateLead(selected.id, { status: "Saved", next: "+3 days" })}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[360px,1fr]">
            <Card className="rounded-3xl bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Agent Quick Add</CardTitle>
                <p className="text-sm text-zinc-500">Fast entry for daily outreach.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Agent name" className="rounded-2xl" />
                <Input placeholder="Phone" className="rounded-2xl" />
                <Input placeholder="Market" className="rounded-2xl" />
                <Button className="w-full rounded-2xl">Add Agent</Button>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {agents.map((agent) => (
                <Card key={agent.id} className="rounded-3xl bg-white shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-semibold">{agent.name}</div>
                        <div className="text-sm text-zinc-500">
                          {agent.type} • {agent.market}
                        </div>
                        <div className="mt-2 text-sm">{agent.notes}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={
                            agent.next === "Overdue"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }
                        >
                          {agent.next}
                        </Badge>
                        <Button variant="outline" className="rounded-2xl">
                          <Phone className="mr-2 h-4 w-4" />
                          Call
                        </Button>
                        <Button className="rounded-2xl">Log Follow-Up</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
