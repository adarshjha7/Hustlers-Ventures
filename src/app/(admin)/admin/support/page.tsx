"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import InboxList, { AdminThreadListItem } from "./components/InboxList";
import ThreadPanel from "./components/ThreadPanel";
import type { SupportStatus } from "@/lib/supportUtils";

const LIST_POLL_INTERVAL_MS = 30000;

export default function AdminSupportPage() {
  return (
    <Suspense>
      <AdminSupportPageInner />
    </Suspense>
  );
}

function AdminSupportPageInner() {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<AdminThreadListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("thread"));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | SupportStatus>("ALL");

  // resetSelection=true re-validates the current selection against the new results (used when
  // the filter/search itself changes); background refreshes and post-update reloads leave the
  // open ticket alone even if it temporarily falls outside the current filter, so an admin editing
  // a ticket (e.g. marking it CLOSED while viewing the "Open" filter) doesn't get the panel yanked away.
  const loadThreads = useCallback(async (resetSelection = false) => {
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/admin/support/threads?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setThreads(data.threads);
    if (resetSelection) {
      setSelectedId(prev => {
        if (prev && data.threads.some((t: AdminThreadListItem) => t.id === prev)) return prev;
        return data.threads[0]?.id ?? null;
      });
    }
  }, [filter, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial + polled data fetch, not derived state
    loadThreads(true);
    const interval = setInterval(() => { if (!document.hidden) loadThreads(false); }, LIST_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadThreads]);

  return (
    <div className="h-[calc(100vh-60px)] bg-white flex overflow-hidden">
      <div className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-[340px] md:shrink-0 flex-col`}>
        <InboxList
          threads={threads}
          selectedId={selectedId}
          onSelect={setSelectedId}
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      <div className={`${selectedId ? "flex" : "hidden md:flex"} flex-1 min-w-0`}>
        {selectedId ? (
          <ThreadPanel
            key={selectedId}
            threadId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <MessageCircle className="w-10 h-10 mb-2" />
            <p className="text-sm font-semibold text-gray-400">Select a ticket to view the conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
