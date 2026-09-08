"use client";

import { useState } from "react";
import { X, Loader2, Paperclip, Send } from "lucide-react";
import { SUPPORT_CATEGORIES } from "@/lib/supportUtils";

interface PendingAttachment {
  path: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  fileCategory: string;
}

interface Props {
  onClose: () => void;
  onCreated: (threadId: string) => void;
}

export default function NewRequestModal({ onClose, onCreated }: Props) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/support/attachments/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setAttachments(prev => [...prev, data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/support/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message, attachments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create request.");
      onCreated(data.threadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#0B1120] px-5 py-4 flex items-center justify-between">
          <p className="text-white font-bold text-sm">New Support Request</p>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Question about my Q2 payout"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05CE78]/30 focus:border-[#05CE78] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05CE78]/30 focus:border-[#05CE78] transition-colors bg-white"
            >
              {SUPPORT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your query or concern..."
              required
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05CE78]/30 focus:border-[#05CE78] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer w-fit">
              <Paperclip className="w-3.5 h-3.5" />
              Attach Image or Doc
              <input
                type="file"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
            {uploading && <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</p>}
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((a, i) => (
                  <li key={i} className="text-xs text-gray-600 truncate">{a.fileName}</li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={submitting || uploading || !subject.trim() || !message.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
