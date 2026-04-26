"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LeafletMapContainer = MapContainer as unknown as ComponentType<{
  center: [number, number];
  zoom: number;
  scrollWheelZoom: boolean;
  children: ReactNode;
}>;
const LeafletTileLayer = TileLayer as unknown as ComponentType<{
  attribution: string;
  url: string;
}>;
const LeafletCircle = Circle as unknown as ComponentType<{
  center: [number, number];
  radius: number;
  pathOptions: {
    color: string;
    fillColor: string;
    fillOpacity: number;
    weight: number;
  };
  children: ReactNode;
}>;
const LeafletCircleMarker = CircleMarker as unknown as ComponentType<{
  center: [number, number];
  radius: number;
  eventHandlers: { click: () => void };
  pathOptions: {
    color: string;
    fillColor: string;
    fillOpacity: number;
    weight: number;
  };
  children: ReactNode;
}>;
const LeafletPopup = Popup as unknown as ComponentType<{ children: ReactNode }>;

type MapLead = {
  id: number;
  name: string;
  address: string;
  county: string;
  phone: string;
  stage: string;
  status: string;
  lat: number;
  lng: number;
};

type MapViewProps = {
  leads: MapLead[];
  dark?: boolean;
};

function FlyToLead({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], 11, { duration: 0.8 });
  }, [lat, lng, map]);

  return null;
}

function densityColor(count: number) {
  if (count >= 3) return "#ef4444";
  if (count === 2) return "#facc15";
  return "#22c55e";
}

export default function MapView({ leads, dark = false }: MapViewProps) {
  const [activeLeadId, setActiveLeadId] = useState<number>(leads[0]?.id ?? 0);
  const activeLead = leads.find((lead) => lead.id === activeLeadId) ?? leads[0];

  const zones = useMemo(() => {
    const grouped = new Map<
      string,
      {
        count: number;
        lat: number;
        lng: number;
      }
    >();

    for (const lead of leads) {
      const current = grouped.get(lead.county) ?? { count: 0, lat: 0, lng: 0 };
      current.count += 1;
      current.lat += lead.lat;
      current.lng += lead.lng;
      grouped.set(lead.county, current);
    }

    return [...grouped.entries()].map(([county, value]) => ({
      county,
      count: value.count,
      lat: value.lat / value.count,
      lng: value.lng / value.count,
      color: densityColor(value.count),
      radius: value.count >= 3 ? 5200 : value.count === 2 ? 3800 : 2600,
    }));
  }, [leads]);

  return (
    <div className="grid gap-5 xl:grid-cols-[360px,1fr]">
      <Card className={`rounded-3xl shadow-sm ${dark ? "border-white/10 bg-zinc-900/85 text-zinc-100" : "bg-white"}`}>
        <CardHeader>
          <CardTitle>Map lead list</CardTitle>
          <p className={`text-sm ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
            Tap a row to center the map and inspect the property popup.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setActiveLeadId(lead.id)}
              className={`pressable w-full rounded-2xl border p-4 text-left transition ${
                activeLeadId === lead.id
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : dark
                    ? "border-white/10 bg-zinc-950/70"
                    : "bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{lead.name}</div>
                  <div className={`mt-1 text-sm ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
                    {lead.address}
                  </div>
                </div>
                <Badge className="bg-zinc-100 text-zinc-700">{lead.stage}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span
                  className={`rounded-full px-3 py-1 ${
                    dark ? "border border-white/10 bg-zinc-800 text-zinc-200" : "bg-zinc-100"
                  }`}
                >
                  {lead.county}
                </span>
                <span
                  className={`rounded-full px-3 py-1 ${
                    dark ? "border border-white/10 bg-zinc-800 text-zinc-200" : "bg-zinc-100"
                  }`}
                >
                  {lead.status}
                </span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className={`rounded-3xl shadow-sm ${dark ? "border-white/10 bg-zinc-900/85 text-zinc-100" : "bg-white"}`}>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>OpenStreetMap lead view</CardTitle>
              <p className={`mt-1 text-sm ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
                Density zones are shaded by county: green low, yellow medium, red high.
              </p>
            </div>
            {activeLead && (
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-100 text-green-700">Low</Badge>
                <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>
                <Badge className="bg-red-100 text-red-700">High</Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
            <div className="h-[380px] overflow-hidden rounded-[1.5rem] xl:h-[620px]">
              {activeLead && (
                <LeafletMapContainer
                  center={[activeLead.lat, activeLead.lng] as [number, number]}
                  zoom={10}
                  scrollWheelZoom
                >
                  <LeafletTileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FlyToLead lat={activeLead.lat} lng={activeLead.lng} />

                  {zones.map((zone) => (
                    <LeafletCircle
                      key={zone.county}
                      center={[zone.lat, zone.lng] as [number, number]}
                      radius={zone.radius}
                      pathOptions={{
                        color: zone.color,
                        fillColor: zone.color,
                        fillOpacity: 0.18,
                        weight: 1.5,
                      }}
                    >
                      <LeafletPopup>
                        <div className="space-y-1">
                          <div className="font-semibold">{zone.county}</div>
                          <div className="text-sm">{zone.count} active mapped leads</div>
                        </div>
                      </LeafletPopup>
                    </LeafletCircle>
                  ))}

                  {leads.map((lead) => (
                    <LeafletCircleMarker
                      key={lead.id}
                      center={[lead.lat, lead.lng] as [number, number]}
                      radius={activeLeadId === lead.id ? 11 : 8}
                      eventHandlers={{ click: () => setActiveLeadId(lead.id) }}
                      pathOptions={{
                        color: activeLeadId === lead.id ? "#1d4ed8" : "#0f172a",
                        fillColor: activeLeadId === lead.id ? "#2563eb" : "#f97316",
                        fillOpacity: 0.94,
                        weight: 2,
                      }}
                    >
                      <LeafletPopup>
                        <div className="min-w-[220px] space-y-3">
                          <div>
                            <div className="font-semibold">{lead.name}</div>
                            <div className="text-sm text-zinc-500">{lead.address}</div>
                          </div>
                          <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-zinc-500" />
                              <span>{lead.phone || "No phone"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-zinc-500" />
                              <span>
                                {lead.stage} • {lead.status}
                              </span>
                            </div>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open in Google Maps
                          </a>
                        </div>
                      </LeafletPopup>
                    </LeafletCircleMarker>
                  ))}
                </LeafletMapContainer>
              )}
            </div>

            {activeLead && (
              <div className={`rounded-[1.5rem] border p-4 ${dark ? "border-white/10 bg-zinc-950/70" : "bg-zinc-50"}`}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Selected property
                </div>
                <div className="mt-3 text-xl font-semibold">{activeLead.name}</div>
                <div className={`mt-1 text-sm ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
                  {activeLead.address}
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/80">
                    <div className="text-zinc-500 dark:text-zinc-400">Phone</div>
                    <div className="font-medium">{activeLead.phone || "No phone"}</div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/80">
                    <div className="text-zinc-500 dark:text-zinc-400">Status / Stage</div>
                    <div className="font-medium">
                      {activeLead.status} • {activeLead.stage}
                    </div>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeLead.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
