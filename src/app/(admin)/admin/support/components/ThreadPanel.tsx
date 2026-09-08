"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Paperclip, Send, ArrowLeft, CheckCircle2 } from "lucide-react";
import AttachmentCard from "@/components/support/AttachmentCard";
import { StatusPill, CategoryPill } from "@/components/support/badges";
import InvestorContextPanel, { InvestorContext } from "./InvestorContextPanel";

interface Attachment {
  id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  file_category: "IMAGE" | "DOCUMENT";
  downloadUrl: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  sender_role: "INVESTOR" | "ADMIN";
  content: string | null;
  created_at: string;
  attachments: Attachment[];
}

interface ThreadDetail {
  id: string;
  ticket_ref: string;
  subject: string;
  category: string;
  status: string;
}

const POLL_INTERVAL_MS = 15000;

export default function ThreadPanel({ threadId, onBack }: { threadId: string; onBack?: () => void }) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<InvestorContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<{ path: string; fileName: string; sizeBytes: number; mimeType: string; fileCategory: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/admin/support/threads/${threadId}`);
      if (!res.ok) return;
      const data = await res.json();
      setThread(data.thread);
      setMessages(data.messages);
      setContext(data.investorContext);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    load();
    const interval = setInterval(() => { if (!document.hidden) load(true); }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("threadId", threadId);
      const res = await fetch("/api/admin/support/attachments/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setPendingAttachment(data);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!content.trim() && !pendingAttachment) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachments: pendingAttachment ? [pendingAttachment] : [] }),
      });
      if (res.ok) {
        setContent("");
        setPendingAttachment(null);
        await load(true);
      }
    } finally {
      setSending(false);
    }
  };

  if (loading || !thread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-w-0 h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {onBack && (
                <button
                  onClick={onBack}
                  className="md:hidden p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                  aria-label="Back to inbox"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-base font-black text-gray-900 truncate">{thread.subject}</h2>
              <span className="text-xs text-gray-400 font-mono shrink-0">({thread.ticket_ref})</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <CategoryPill category={thread.category} />
              <StatusPill status={thread.status} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_role === "ADMIN" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 border ${
                m.sender_role === "ADMIN" ? "bg-[#05CE78] border-[#04b86c] text-white" : "bg-white border-gray-200 text-gray-900"
              }`}>
                <div className={`flex items-center justify-between gap-4 mb-1 text-xs ${m.sender_role === "ADMIN" ? "text-white/80" : "text-gray-400"}`}>
                  <span className="font-bold">{m.sender_role === "ADMIN" ? "Admin" : context?.name ?? "Investor"}</span>
                  <span>{new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>
                </div>
                {m.content && <p className="text-sm leading-relaxed whitespace-pre-line">{m.content}</p>}
                {m.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {m.attachments.map(a => <AttachmentCard key={a.id} attachment={a} />)}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {thread.status === "CLOSED" ? (
          <div className="border-t border-gray-100 p-6 shrink-0 bg-gray-50 flex flex-col items-center justify-center gap-1.5 text-center">
            <CheckCircle2 className="w-6 h-6 text-[#05CE78]" />
            <p className="text-sm font-bold text-gray-700">This ticket is resolved.</p>
            <p className="text-xs text-gray-500">Only the investor can reopen it from their dashboard.</p>
          </div>
        ) : (
          <div className="border-t border-gray-100 p-4 shrink-0">
            {pendingAttachment && (
              <div className="mb-2 text-xs text-gray-600 flex items-center gap-2">
                <Paperclip className="w-3 h-3" /> {pendingAttachment.fileName}
                <button onClick={() => setPendingAttachment(null)} className="text-red-500 font-bold">Remove</button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05CE78]/30 focus:border-[#05CE78] transition-colors resize-none bg-white"
              />
              <label className="p-2.5 text-gray-400 hover:text-gray-700 cursor-pointer rounded-xl hover:bg-gray-100 transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
              <button
                onClick={handleSend}
                disabled={sending || (!content.trim() && !pendingAttachment)}
                className="px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-white font-bold text-xs flex items-center gap-1.5 bg-[#05CE78] hover:bg-[#04b86c]"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Reply
              </button>
            </div>
          </div>
        )}
      </div>

      {context && <InvestorContextPanel context={context} />}
    </div>
  );
}
