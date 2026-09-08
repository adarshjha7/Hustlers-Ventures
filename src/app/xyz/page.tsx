"use client";

// Terminal 44 — live bus bay display board (demo).
// Public, unauthenticated, full-screen — meant for a TV, not a browser tab.
// Cycles: data board (10s) -> media slide (5s) -> data board (10s) -> media
// slide (5s) -> repeat, forever, with no manual interaction. Each media
// slide rotates through MEDIA (two bus animation clips + the Terminal 44
// exterior photo), one per turn. The data board is backed by Supabase
// Realtime (see bus_bay_display_migration.sql) so any change made to the
// bus_bay_display table appears here within moments — no page refresh
// needed on the TV itself.

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

interface BusEntry {
  id: string;
  bay: string;
  bus_number: string;
  operator_name: string;
  route_from: string;
  route_to: string;
  route_via: string | null;
  scheduled_arrival: string;
  scheduled_departure: string;
  status: "scheduled" | "approaching" | "boarding" | "at_terminal" | "departed";
  sort_order: number;
}

const STATUS_STYLES: Record<BusEntry["status"], { label: string; className: string }> = {
  at_terminal: { label: "AT TERMINAL", className: "bg-[#05CE78] text-[#0B1120]" },
  boarding:    { label: "BOARDING",    className: "bg-blue-500 text-white" },
  approaching: { label: "APPROACHING", className: "bg-orange-500 text-white" },
  scheduled:   { label: "SCHEDULED",   className: "bg-gray-500 text-white" },
  departed:    { label: "DEPARTED",    className: "bg-white/10 text-gray-400" },
};

type Media = { type: "video"; src: string } | { type: "image"; src: string };

const MEDIA: Media[] = [
  { type: "video", src: "/xyz/bus-animation-1.mp4" },
  { type: "video", src: "/xyz/bus-animation-2.mp4" },
  { type: "image", src: "/xyz/terminal44-exterior.png" },
];
const DATA_DURATION_MS = 10_000;
const MEDIA_DURATION_MS = 5_000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function BusDisplayPage() {
  const [entries, setEntries] = useState<BusEntry[]>([]);
  const [now, setNow] = useState<Date | null>(null); // null until mounted — avoids SSR/client clock mismatch
  const [phase, setPhase] = useState<"data" | "media">("data");
  const [mediaIdx, setMediaIdx] = useState(0);

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase
      .from("bus_bay_display")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    setEntries((data as BusEntry[]) ?? []);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchEntries is stable (useCallback, []); matches the fetch-on-mount pattern used throughout the admin/dashboard pages
  useEffect(() => { fetchEntries(); }, []);

  // Realtime — any INSERT/UPDATE/DELETE on bus_bay_display refetches
  // automatically. This is the "no refresh needed" requirement: the TV
  // just sits on this page and the board updates itself.
  useEffect(() => {
    const channel = supabase
      .channel("bus_bay_display_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_bay_display" }, () => {
        fetchEntries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live clock. `now` starts null so the server-rendered HTML and the
  // client's first hydration pass match exactly (a lazy useState
  // initializer that read `new Date()` would differ between the two and
  // cause a real hydration mismatch) — it's only ever set client-side,
  // after mount, which is the standard pattern for this.
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Phase cycle — fixed-duration recursive timeout, not setInterval, since
  // the two phases run for different lengths of time.
  useEffect(() => {
    const duration = phase === "data" ? DATA_DURATION_MS : MEDIA_DURATION_MS;
    const t = setTimeout(() => {
      if (phase === "data") {
        setMediaIdx(i => (i + 1) % MEDIA.length); // rotate through both clips + the photo
        setPhase("media");
      } else {
        setPhase("data");
      }
    }, duration);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="fixed inset-0 bg-[#0B1120] text-white overflow-hidden font-sans select-none">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* --- Data board --- */}
      <div className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${phase === "data" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-7 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 shrink-0">
              <Image src="/brands/terminal44.png" alt="Terminal 44" fill className="object-contain" priority />
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight leading-none">TERMINAL 44</p>
              <p className="text-orange-400 text-sm font-bold tracking-wide mt-1">Food. Travel. Together.</p>
            </div>
          </div>
          <p className="text-4xl font-extrabold tracking-tight">BUS INFORMATION</p>
          <div className="text-right">
            <p className="text-3xl font-extrabold tabular-nums leading-none">{now ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--:--"}</p>
            <p className="text-orange-400 text-xs font-bold tracking-widest mt-1">LIVE FROM TERMINAL 44</p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 px-10 py-6 overflow-hidden">
          <div className="grid grid-cols-[90px_170px_190px_1fr_150px_150px_170px] gap-4 px-5 pb-4 text-xs font-bold tracking-widest text-white/40 uppercase border-b border-white/10">
            <span>Bay</span>
            <span>Bus Number</span>
            <span>Operator</span>
            <span>Route</span>
            <span>Arrival Time</span>
            <span>Departure Time</span>
            <span>Status</span>
          </div>

          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/30 text-lg font-medium">Waiting for bay data…</div>
          ) : (
            <div className="divide-y divide-white/5">
              {entries.map(e => {
                const status = STATUS_STYLES[e.status] ?? STATUS_STYLES.scheduled;
                return (
                  <div key={e.id} className="grid grid-cols-[90px_170px_190px_1fr_150px_150px_170px] gap-4 items-center px-5 py-4">
                    <span className="inline-flex items-center justify-center w-14 h-9 rounded-lg bg-[#05CE78] text-[#0B1120] font-extrabold text-sm">{e.bay}</span>
                    <span className="font-mono font-bold text-lg">{e.bus_number}</span>
                    <span className="font-bold text-base text-gray-200">{e.operator_name}</span>
                    <span className="min-w-0">
                      <span className="font-bold text-base">{e.route_from} → {e.route_to}</span>
                      {e.route_via && <span className="block text-xs text-white/40 mt-0.5">Via {e.route_via}</span>}
                    </span>
                    <span className="font-bold text-base text-emerald-300">{formatTime(e.scheduled_arrival)}</span>
                    <span className="font-bold text-base text-orange-300">{formatTime(e.scheduled_departure)}</span>
                    <span className={`inline-flex w-fit items-center px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-wide ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- Media slide (bus animation clips + Terminal 44 photo) --- */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-700 ${phase === "media" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {phase === "media" && (
          MEDIA[mediaIdx].type === "video" ? (
            <video
              key={MEDIA[mediaIdx].src}
              src={MEDIA[mediaIdx].src}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              key={MEDIA[mediaIdx].src}
              src={MEDIA[mediaIdx].src}
              alt="Terminal 44"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          )
        )}
      </div>
    </div>
  );
}
