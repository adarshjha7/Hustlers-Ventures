"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Loader2, CheckCircle } from "lucide-react";

interface Props {
  investorName: string;
  investorEmail: string;
}

export default function HelpButton({ investorName, investorEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: investorName,
          email: investorEmail,
          subject,
          message,
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setSubject("");
      setMessage("");
      setTimeout(() => { setSent(false); setOpen(false); }, 2500);
    } catch {
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Get help"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-black font-bold text-sm px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Help</span>
      </button>

      {/* BACKDROP */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MODAL */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">

          {/* HEADER */}
          <div className="bg-[#0B1120] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Send us a message</p>
              <p className="text-gray-400 text-xs mt-0.5">We'll get back to you shortly.</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#05CE78]" />
              </div>
              <p className="text-gray-900 font-bold text-sm">Message sent!</p>
              <p className="text-gray-500 text-xs text-center">We'll get back to you on <span className="font-medium">{investorEmail}</span>.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* FROM (read-only) */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">From</p>
                  <p className="text-sm font-bold text-gray-800">{investorName}</p>
                  <p className="text-xs text-gray-500">{investorEmail}</p>
                </div>
              </div>

              {/* SUBJECT */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Question about my April payout"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05CE78]/30 focus:border-[#05CE78] transition-colors"
                />
              </div>

              {/* MESSAGE */}
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

              <button
                type="submit"
                disabled={sending || !subject.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#0B1120] hover:bg-gray-800 text-white font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
