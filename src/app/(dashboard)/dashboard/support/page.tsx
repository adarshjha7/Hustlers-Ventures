"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MessageCircle } from "lucide-react";
import TicketList, { ThreadListItem } from "./components/TicketList";
import ThreadPanel from "./components/ThreadPanel";
import NewRequestModal from "./components/NewRequestModal";
import type { SupportStatus } from "@/lib/supportUtils";

const LIST_POLL_INTERVAL_MS = 30000;

export default function SupportPage() {
  return (
    <Suspense>
      <SupportPageInner />
    </Suspense>
  );
}

function SupportPageInner() {
  const searchParams = useSearchParams();
  const [investorName, setInvestorName] = useState("Investor");
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("thread"));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | SupportStatus>("ALL");
  const [showNewRequest, setShowNewRequest] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // A login can map to more than one investor profile (e.g. a shared family/associate
        // login) — fetch all matches rather than .single(), which errors on >1 row.
        supabase.from("investors").select("investor_name").eq("user_id", data.user.id)
          .then(({ data: rows }) => {
            if (rows && rows.length > 0) setInvestorName(rows.map(r => r.investor_name.trim()).join(" & "));
          });
      }
    });
  }, []);

  // resetSelection=true clears the current selection if it fell outside the new filter/search
  // results (used when the filter/search itself changes) — it never auto-opens a different thread,
  // so switching filters just re-narrows the list instead of jumping straight into a conversation.
  // Background refreshes leave the open thread alone even if it temporarily falls outside the
  // current filter, so it isn't yanked out from under the user either.
  const loadThreads = useCallback(async (resetSelection = false) => {
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/support/threads?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setThreads(data.threads);
    if (resetSelection) {
      setSelectedId(prev => (prev && data.threads.some((t: ThreadListItem) => t.id === prev)) ? prev : null);
    }
  }, [filter, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial + polled data fetch, not derived state
    loadThreads(true);
    const interval = setInterval(() => { if (!document.hidden) loadThreads(false); }, LIST_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadThreads]);

  return (
    <div className="h-[calc(100vh-108px)] -m-4 sm:-m-6 lg:-m-8 bg-white flex overflow-hidden border border-gray-200">
      <div className={`${selectedId ? "hidden sm:flex" : "flex"} w-full sm:w-[340px] sm:shrink-0 flex-col`}>
        <TicketList
          threads={threads}
          selectedId={selectedId}
          onSelect={setSelectedId}
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          onNewRequest={() => setShowNewRequest(true)}
        />
      </div>

      <div className={`flex-1 min-w-0 ${selectedId ? "flex" : "hidden sm:flex"} flex-col`}>
        {selectedId ? (
          <ThreadPanel
            key={selectedId}
            threadId={selectedId}
            investorName={investorName}
            onBack={() => setSelectedId(null)}
            onUpdated={() => loadThreads(false)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <MessageCircle className="w-10 h-10 mb-2" />
            <p className="text-sm font-semibold text-gray-400">Select a request to view the conversation</p>
          </div>
        )}
      </div>

      {showNewRequest && (
        <NewRequestModal
          onClose={() => setShowNewRequest(false)}
          onCreated={(threadId) => {
            setShowNewRequest(false);
            loadThreads().then(() => setSelectedId(threadId));
          }}
        />
      )}
    </div>
  );
}
