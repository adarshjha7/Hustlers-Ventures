"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UserCog, X, Search, Loader2, AlertCircle, LogIn } from "lucide-react";

interface InvestorOption {
  investor_id: string;
  investor_name: string;
  user_id: string;
  email: string;
  is_active: boolean;
}

type Step = "pick" | "confirm";

export default function LoginAsInvestorButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [loadingList, setLoadingList] = useState(false);
  const [investors, setInvestors] = useState<InvestorOption[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InvestorOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setSelected(null);
    setError("");
    setSearch("");
    setLoadingList(true);
    fetch("/api/admin/investors")
      .then(r => r.json())
      .then(data => setInvestors((data.investors ?? []).filter((i: InvestorOption) => i.is_active)))
      .catch(() => setError("Could not load investors."))
      .finally(() => setLoadingList(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return investors;
    return investors.filter(i => i.investor_name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q));
  }, [investors, search]);

  const handleLogin = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/impersonate-investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.user_id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not log in as this investor."); setSubmitting(false); return; }

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.tokenHash,
        type: "email",
      });
      if (otpError) { setError(otpError.message || "Login failed. Please try again."); setSubmitting(false); return; }

      sessionStorage.setItem("hv_impersonating", "1");
      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-colors text-[13px] font-semibold tracking-tight w-full"
      >
        <UserCog className="w-4 h-4" />
        Login as Investor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !submitting && setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-[#05CE78]" /> Login as Investor
              </h3>
              <button onClick={() => !submitting && setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === "pick" && (
              <div className="flex flex-col overflow-hidden flex-1">
                <div className="p-4 border-b border-gray-100 shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name or email…"
                      autoFocus
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  {loadingList ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-12">No investors found.</p>
                  ) : (
                    filtered.map(inv => (
                      <button
                        key={inv.investor_id}
                        onClick={() => { setSelected(inv); setStep("confirm"); }}
                        className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{inv.investor_name}</p>
                          <p className="text-xs text-gray-400 truncate">{inv.email}</p>
                        </div>
                        <LogIn className="w-4 h-4 text-gray-300 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {step === "confirm" && selected && (
              <div className="p-5">
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-5">
                  You&apos;ll be logged in as <span className="font-bold text-gray-900">{selected.investor_name}</span> ({selected.email}) and taken to their dashboard. This ends your current admin session — sign back in with your admin credentials afterward.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("pick")}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleLogin}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold text-sm transition-colors disabled:opacity-70"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging in…</> : "Confirm & Login"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}