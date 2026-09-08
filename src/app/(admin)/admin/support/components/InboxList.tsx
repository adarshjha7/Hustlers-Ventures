"use client";

import { Search, MessageCircle, Paperclip } from "lucide-react";
import { StatusPill } from "@/components/support/badges";
import type { SupportStatus } from "@/lib/supportUtils";

export interface AdminThreadListItem {
  id: string;
  ticket_ref: string;
  subject: string;
  status: SupportStatus;
  last_message_at: string;
  admin_unread_count: number;
  investor_name: string;
  associate_name: string | null;
  message_count: number;
  last_message: string | null;
  created_at: string;
}

function formatRaisedAt(dateStr: string): string {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return `Raised ${date}, ${time}`;
}

const FILTERS: { label: string; value: "ALL" | SupportStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "CLOSED" },
];

interface Props {
  threads: AdminThreadListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  filter: "ALL" | SupportStatus;
  onFilterChange: (v: "ALL" | SupportStatus) => void;
}

export default function InboxList({ threads, selectedId, onSelect, search, onSearchChange, filter, onFilterChange }: Props) {
  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-base font-black text-gray-900 mb-1">Support Tickets Inbox</h2>
        <p className="text-xs text-gray-500">{threads.length} {threads.length === 1 ? "ticket" : "tickets"} raised</p>
      </div>

      <div className="p-3 border-b border-gray-100 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search subject, ID or investor..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05CE78]/30 focus:border-[#05CE78] transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                filter === f.value ? "bg-[#0B1120] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {threads.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">No support tickets.</div>
        ) : (
          threads.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors relative ${
                selectedId === t.id ? "bg-[#05CE78]/[0.06] border-[#05CE78]/40" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {selectedId === t.id && <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-[#05CE78]" />}
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-bold text-gray-900 line-clamp-1">
                  {t.investor_name}
                  {t.associate_name && <span className="text-gray-400 font-normal"> ({t.associate_name})</span>}
                  <span className="text-gray-400 font-normal"> — {t.subject}</span>
                </p>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(t.last_message_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              {t.last_message && (
                <p className="text-xs text-gray-500 line-clamp-1 mb-2 flex items-center gap-1">
                  {!t.last_message.trim() ? <Paperclip className="w-3 h-3 shrink-0" /> : null}
                  {t.last_message.trim() || "Sent an attachment"}
                </p>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                <StatusPill status={t.status} />
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                  <MessageCircle className="w-3 h-3" /> {t.message_count}
                </span>
                <span className="text-xs text-gray-400">{formatRaisedAt(t.created_at)}</span>
                {t.admin_unread_count > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#05CE78] text-white text-[10px] font-bold">
                    {t.admin_unread_count}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
