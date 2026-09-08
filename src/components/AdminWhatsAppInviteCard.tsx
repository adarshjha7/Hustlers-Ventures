"use client";

import { useState } from "react";
import {
  Send, Loader2, AlertCircle, CheckCircle, X, MessageCircle, RefreshCw, Copy, Check, ExternalLink,
} from "lucide-react";

export default function AdminWhatsAppInviteCard({
  investorId,
  initialName = "",
  initialPhone = "",
  initialAssociateName = "",
  onSent,
}: {
  // When set, this targets one specific pending investor row (Admin -> Investors' per-row
  // "Resend / Update Invite" action) instead of the generic "invite someone new" flow —
  // skips fuzzy phone matching server-side, so changing the phone here is always safe.
  investorId?: string;
  initialName?: string;
  initialPhone?: string;
  initialAssociateName?: string;
  onSent?: () => void;
}) {
  const isRowMode = !!investorId;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [associateName, setAssociateName] = useState(initialAssociateName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ inviteUrl: string; whatsappSent: boolean; whatsappError?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setName(initialName);
    setPhone(initialPhone);
    setAssociateName(initialAssociateName);
    setError("");
    setResult(null);
    setCopied(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/[^\d]/g, "");
    if (!trimmedName) { setError("Name required."); return; }
    if (!/^\d{8,15}$/.test(trimmedPhone)) { setError("Enter a valid phone (e.g. +91 9876543210)."); return; }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone,
          associateName: associateName.trim() || null,
          ...(investorId ? { investorId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setResult({ inviteUrl: data.inviteUrl, whatsappSent: data.whatsappSent, whatsappError: data.whatsappError });
      onSent?.();
    } catch (err: any) {
      setError(err?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    if (!result?.inviteUrl) return;
    navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {isRowMode ? (
        <button
          type="button"
          onClick={() => { reset(); setOpen(true); }}
          className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Resend / update invite (name, phone, or associate)"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#25D366] border border-[#25D366]/30 hover:border-[#25D366] hover:bg-[#25D366]/5 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" /> Send WhatsApp
        </button>
      )}

      {open && (
        <>
          <div onClick={() => { setOpen(false); reset(); }} className="fixed inset-0 bg-black/40 z-40" />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  {isRowMode ? "Resend / Update Invite" : "Send Invite Link"}
                </h3>
                <button onClick={() => { setOpen(false); reset(); }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-5">
                {isRowMode
                  ? "Updates this investor's name/phone and sends a fresh 7-day registration link — safe to use even if the phone number is changing."
                  : "Generates a signed 7-day registration link tied to the investor's phone number and sends it via WhatsApp."}
              </p>

              {result ? (
                <div className="space-y-4">
                  {result.whatsappSent ? (
                    <div className="bg-green-50 border border-green-100 text-green-700 px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" /> WhatsApp sent to {name}.
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 text-amber-700 px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {result.whatsappError ? `WhatsApp failed: ${result.whatsappError}` : "WhatsApp not configured."} Share the link manually.
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Invite Link (valid 7 days)</p>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                      <span className="text-xs text-gray-600 truncate flex-1 font-mono">{result.inviteUrl}</span>
                      <button onClick={copyLink} className="shrink-0 p-1.5 hover:bg-gray-200 rounded-lg transition-colors" title="Copy link">
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                      </button>
                      <a href={result.inviteUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1.5 hover:bg-gray-200 rounded-lg transition-colors" title="Open link">
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </a>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    {!isRowMode && (
                      <button onClick={reset} className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors">
                        Send Another
                      </button>
                    )}
                    <button onClick={() => { setOpen(false); reset(); }} className="px-4 py-2.5 text-sm font-bold bg-[#0B1120] hover:bg-[#05CE78] hover:text-black text-white rounded-xl transition-colors">
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSend} className="space-y-3">
                  <div>
                    <label htmlFor="invite-name" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Investor Name
                    </label>
                    <input
                      id="invite-name"
                      type="text"
                      value={name}
                      onChange={e => { setName(e.target.value); if (error) setError(""); }}
                      placeholder="Riya Sharma"
                      autoComplete="name"
                      autoCapitalize="words"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="invite-phone" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      WhatsApp Phone
                    </label>
                    <input
                      id="invite-phone"
                      type="tel"
                      inputMode="tel"
                      maxLength={18}
                      value={phone}
                      onChange={e => { setPhone(e.target.value.replace(/[^\d+\s-]/g, "")); if (error) setError(""); }}
                      placeholder="+91 9876543210"
                      autoComplete="tel"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all"
                    />
                    {isRowMode && (
                      <p className="text-xs text-gray-400 mt-1.5">Changing this updates their record — safe even if a previous link was already sent.</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="invite-associate" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Associate Name
                      <span className="ml-2 normal-case font-medium tracking-normal text-gray-400">optional</span>
                    </label>
                    <input
                      id="invite-associate"
                      type="text"
                      value={associateName}
                      onChange={e => { setAssociateName(e.target.value); if (error) setError(""); }}
                      placeholder="Defaults to Investor Name if left blank"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => { setOpen(false); reset(); }} className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy || !name || !phone}
                      className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isRowMode ? "Resend" : "Generate & Send"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
