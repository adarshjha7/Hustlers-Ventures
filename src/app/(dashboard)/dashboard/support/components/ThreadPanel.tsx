"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Paperclip, Send, ArrowLeft, RotateCcw, CheckCircle2 } from "lucide-react";
import AttachmentCard from "@/components/support/AttachmentCard";
import { StatusPill } from "@/components/support/badges";

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

export default function ThreadPanel({ threadId, investorName, onBack, onUpdated }: { threadId: string; investorName: string; onBack?: () => void; onUpdated?: () => void }) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<{ path: string; fileName: string; sizeBytes: number; mimeType: string; fileCategory: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [dismissedForMessageId, setDismissedForMessageId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/support/threads/${threadId}`);
      if (!res.ok) return;
      const data = await res.json();
      setThread(data.thread);
      setMessages(data.messages);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (!document.hidden) load(true);
    }, POLL_INTERVAL_MS);
    const onVisible = () => { if (!document.hidden) load(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
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
      const res = await fetch("/api/support/attachments/upload", { method: "POST", body: formData });
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
      const res = await fetch(`/api/support/threads/${threadId}/messages`, {
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

  const handleResolve = async () => {
    setResolving(true);
    try {
      await fetch(`/api/support/threads/${threadId}/resolve`, { method: "POST" });
      await load(true);
      onUpdated?.();
    } finally {
      setResolving(false);
    }
  };

  const handleReopen = async () => {
    setReopening(true);
    try {
      await fetch(`/api/support/threads/${threadId}/reopen`, { method: "POST" });
      await load(true);
      onUpdated?.();
    } finally {
      setReopening(false);
    }
  };

  if (loading || !thread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  const lastMessage = messages[messages.length - 1];
  const showResolvedPrompt =
    thread.status === "IN_PROGRESS" && lastMessage?.sender_role === "ADMIN" && dismissedForMessageId !== lastMessage.id;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 mb-1.5 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="sm:hidden p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              aria-label="Back to requests"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-base font-black text-gray-900 truncate">{thread.subject}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <StatusPill status={thread.status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_role === "INVESTOR" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 border ${
              m.sender_role === "INVESTOR" ? "bg-[#05CE78] border-[#04b86c] text-white" : "bg-white border-gray-200 text-gray-900"
            }`}>
              <div className={`flex items-center justify-between gap-4 mb-1 text-xs ${m.sender_role === "INVESTOR" ? "text-white/80" : "text-gray-400"}`}>
                <span className="font-bold">{m.sender_role === "INVESTOR" ? investorName : "Support Team"}</span>
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

        {showResolvedPrompt && (
          <div className="flex justify-center">
            <div className="max-w-sm w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-center">
              <p className="text-sm font-bold text-gray-800 mb-2.5">Has your issue been resolved?</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="flex items-center gap-1.5 bg-[#05CE78] hover:bg-[#04b86c] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Yes, resolved
                </button>
                <button
                  onClick={() => lastMessage && setDismissedForMessageId(lastMessage.id)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                >
                  No, continue
                </button>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {thread.status === "CLOSED" ? (
        <div className="border-t border-gray-100 p-4 shrink-0 bg-gray-50 space-y-3">
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={handleReopen}
              disabled={reopening}
              className="flex items-center gap-1.5 bg-[#05CE78] hover:bg-[#04b86c] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {reopening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Open this ticket again
            </button>
            <p className="text-xs text-gray-500">This request has been resolved.</p>
          </div>
          <textarea
            disabled
            placeholder="This conversation is closed."
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-400 resize-none cursor-not-allowed"
          />
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
              placeholder="Type your message..."
              rows={2}
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05CE78]/30 focus:border-[#05CE78] transition-colors resize-none"
            />
            <label className="p-2.5 text-gray-400 hover:text-gray-700 cursor-pointer rounded-xl hover:bg-gray-100 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
            <button
              onClick={handleSend}
              disabled={sending || (!content.trim() && !pendingAttachment)}
              className="p-2.5 bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
