"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/logger";
import { formatCurrency, formatCurrencyCompact } from "@/lib/formatters";
import {
  Loader2, TrendingUp, ShieldCheck, Sparkles,
  ExternalLink, ArrowRight, Mail, X, Tag,
  CheckCircle2, FileText, RefreshCw,
} from "lucide-react";

function ReinvestModal() {
  const params = useSearchParams();
  const [open, setOpen] = useState(true);
  const amount = params.get("amount");
  if (!amount || !open) return null;
  const formatted = formatCurrency(Number(amount));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 bg-[#05CE78]/10 border border-[#05CE78]/30 rounded-2xl flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-[#05CE78]" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Put your payout to work</h2>
          <p className="text-gray-500 text-sm mt-1">Your last payout of <span className="text-gray-900 font-bold">{formatted}</span> is sitting idle. Reinvesting it could compound your returns significantly.</p>
        </div>
        <div className="px-6 pb-6 space-y-3 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400">Browse active opportunities below and reach out to our team to invest.</p>
          <button
            onClick={() => setOpen(false)}
            className="w-full py-3 bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold rounded-xl transition-colors text-sm cursor-pointer"
          >
            Browse Opportunities
          </button>
        </div>
      </div>
    </div>
  );
}

interface Category { id: string; name: string; slug: string; }

interface Opportunity {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  min_investment: number | null;
  target_irr: number | null;
  tenure: string | null;
  total_pool_size: number | null;
  computed_filled_pct: number | null;
  pool_name: string | null;
  company_name: string | null;
  brochure_url: string | null;
  detail_url: string | null;
  status: string;
  image_url: string | null;
  volatility_level: string | null;
  volatility_note: string | null;
  opportunity_categories: Category | null;
}

const VOLATILITY_STYLES: Record<string, string> = {
  Low:    "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High:   "bg-red-50 text-red-600 border-red-200",
};

const CATEGORY_COLORS: Record<string, { badge: string; accent: string }> = {
  transportation: { badge: "bg-blue-50 text-blue-700 border-blue-200",    accent: "border-t-blue-400" },
  hospitality:    { badge: "bg-purple-50 text-purple-700 border-purple-200", accent: "border-t-purple-400" },
  fnb:            { badge: "bg-orange-50 text-orange-700 border-orange-200", accent: "border-t-orange-400" },
  "debt-funds":   { badge: "bg-rose-50 text-rose-700 border-rose-200",     accent: "border-t-rose-400" },
};

const DEFAULT_COLORS = { badge: "bg-gray-100 text-gray-600 border-gray-200", accent: "border-t-[#05CE78]" };

function getCategoryColors(slug?: string | null): { badge: string; accent: string } {
  return (slug ? CATEGORY_COLORS[slug] : null) ?? DEFAULT_COLORS;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [contactTarget, setContactTarget] = useState<Opportunity | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/opportunities/investor");
      const data = await res.json();
      setOpportunities(data.opportunities ?? []);
      setLoading(false);
      const { data: { user } } = await supabase.auth.getUser();
      logEvent("INFO", "User loaded opportunities page", { userId: user?.id }).catch(() => {});
    }
    load();
  }, []);

  const categories = useMemo(() => {
    const seen = new Map<string, Category>();
    opportunities.forEach(o => {
      if (o.opportunity_categories && !seen.has(o.opportunity_categories.id)) {
        seen.set(o.opportunity_categories.id, o.opportunity_categories);
      }
    });
    return Array.from(seen.values());
  }, [opportunities]);

  const filtered = useMemo(() =>
    activeCategory === "all"
      ? opportunities
      : opportunities.filter(o => o.opportunity_categories?.id === activeCategory),
    [opportunities, activeCategory]
  );

  const handleGetInTouch = async (opp: Opportunity) => {
    setSending(true);
    setSent(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // A login can map to more than one investor profile (e.g. a shared family/associate
      // login) — fetch all matches rather than .single(), which errors on >1 row.
      const { data: profiles } = await supabase.from("investors").select("investor_name").eq("user_id", user?.id);
      const name = profiles && profiles.length > 0 ? profiles.map(p => p.investor_name.trim()).join(" & ") : (user?.email || "An investor");

      await fetch("/api/lead/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: name,
          fromEmail: user?.email || "N/A",
          subject: `Opportunity Enquiry: ${opp.title}`,
          message: `${name} is interested in learning more about:\n\nOpportunity: ${opp.title}\nCategory: ${opp.opportunity_categories?.name ?? "-"}\nMin Investment: ${opp.min_investment != null ? formatCurrency(opp.min_investment) : "-"}\nTarget IRR: ${opp.target_irr != null ? `${opp.target_irr}%` : "-"}\n\nPlease reach out to this investor.`,
        }),
      });

      await logEvent("INFO", "User requested info on opportunity", { userId: user?.id, opportunityId: opp.id, title: opp.title });
      setSent(true);
    } catch {
      setSent(false);
    } finally {
      setSending(false);
    }
  };

  const openContact = (opp: Opportunity) => {
    setContactTarget(opp);
    setSent(false);
    setSending(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">

      <Suspense>
        <ReinvestModal />
      </Suspense>

      {/* Hero banner */}
      <div className="bg-[#0B1120] rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-white">
          <TrendingUp className="w-56 h-56" />
        </div>
        <div className="relative z-10 p-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#05CE78]" />
            <span className="text-xs font-medium text-gray-400">Exclusive to Hustlers Investors</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">Explore New Opportunities</h2>
          <p className="text-gray-400 mt-2 text-sm max-w-xl leading-relaxed">
            Browse our latest curated investment opportunities. Reach out to us for detailed pitch decks, financials, and next steps.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 text-sm font-bold rounded-xl border transition-colors cursor-pointer ${activeCategory === "all" ? "bg-[#0B1120] text-white border-[#0B1120]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900"}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border transition-colors cursor-pointer ${activeCategory === cat.id ? "bg-[#0B1120] text-white border-[#0B1120]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900"}`}
            >
              <Tag className="w-3.5 h-3.5" /> {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <ShieldCheck className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm font-medium">No opportunities available right now.</p>
          <p className="text-xs mt-1 text-gray-500">Check back soon - new opportunities are added regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(opp => {
            const colors = getCategoryColors(opp.opportunity_categories?.slug);
            const filledPct = opp.computed_filled_pct;
            const isComingSoon = opp.status === "coming_soon";
            return (
              <div key={opp.id} className={`bg-white rounded-2xl border border-gray-200 border-t-4 ${colors.accent} shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group`}>

                {/* Thumbnail */}
                {opp.image_url && (
                  <div className="relative w-full h-36 overflow-hidden bg-[#0B1120]">
                    <Image
                      src={opp.image_url}
                      alt={opp.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}

                {/* Card header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {opp.opportunity_categories && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${colors.badge}`}>
                          <Tag className="w-3 h-3" /> {opp.opportunity_categories.name}
                        </span>
                      )}
                      {opp.volatility_level && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${VOLATILITY_STYLES[opp.volatility_level] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
                          title={opp.volatility_note ?? undefined}>
                          {opp.volatility_level} Risk
                        </span>
                      )}
                    </div>
                    {isComingSoon ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Coming Soon
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#05CE78]/10 text-[#05CE78] px-2 py-0.5 rounded-md text-xs font-bold border border-[#05CE78]/20 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#05CE78] animate-pulse" /> Live
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#05CE78] transition-colors leading-snug">
                    {opp.title}
                  </h3>
                  {opp.tagline && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{opp.tagline}</p>}
                  {(opp.pool_name || opp.company_name) && (
                    <p className="text-xs text-gray-400 mt-0.5">{opp.pool_name ?? opp.company_name}</p>
                  )}
                </div>

                {/* Stats — compact single row */}
                <div className="px-4 pb-3">
                  <div className="flex items-center divide-x divide-gray-100 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex-1 px-3 py-2 text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Min</p>
                      <p className="text-xs font-extrabold text-gray-900 mt-0.5">
                        {opp.min_investment != null ? formatCurrencyCompact(opp.min_investment) : "—"}
                      </p>
                    </div>
                    <div className="flex-1 px-3 py-2 text-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">IRR</p>
                      <p className="text-xs font-extrabold text-[#05CE78] mt-0.5">
                        {opp.target_irr != null ? `${opp.target_irr}%` : "—"}
                      </p>
                    </div>
                    {opp.tenure && (
                      <div className="flex-1 px-3 py-2 text-center">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tenure</p>
                        <p className="text-xs font-extrabold text-gray-900 mt-0.5">{opp.tenure}</p>
                      </div>
                    )}
                  </div>

                  {/* Fill progress */}
                  {filledPct != null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 font-medium">Pool filled</span>
                        <span className="font-bold text-gray-700">{filledPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#05CE78] rounded-full transition-all" style={{ width: `${filledPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 mt-auto flex gap-2">
                  {opp.brochure_url && (
                    <a href={opp.brochure_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-[#05CE78] hover:text-[#05CE78] transition-colors">
                      <FileText className="w-3.5 h-3.5" /> Brochure
                    </a>
                  )}
                  {opp.detail_url ? (
                    <a
                      href={opp.detail_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0B1120] hover:bg-[#05CE78] hover:text-black text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Details <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => openContact(opp)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0B1120] hover:bg-[#05CE78] hover:text-black text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" /> Get in Touch <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Get in Touch modal */}
      {contactTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B1120] p-6 relative">
              <button onClick={() => setContactTarget(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 bg-[#05CE78]/10 border border-[#05CE78]/20 rounded-2xl flex items-center justify-center mb-4">
                {sent ? <CheckCircle2 className="w-6 h-6 text-[#05CE78]" /> : <Mail className="w-6 h-6 text-[#05CE78]" />}
              </div>
              <h2 className="text-xl font-extrabold text-white">{sent ? "Request Sent!" : "Get in Touch"}</h2>
              <p className="text-gray-400 text-sm mt-1">
                {sent ? "Our team has been notified and will reach out to you within 24-48 hours." : `Interested in ${contactTarget.title}? We'll send your details to our team.`}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-100 rounded-xl divide-y divide-gray-100">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Opportunity</span>
                  <span className="text-sm font-bold text-gray-900 text-right max-w-[60%] line-clamp-1">{contactTarget.title}</span>
                </div>
                {contactTarget.min_investment != null && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Min Investment</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(contactTarget.min_investment)}</span>
                  </div>
                )}
                {contactTarget.target_irr != null && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Target IRR</span>
                    <span className="text-sm font-bold text-[#05CE78]">{contactTarget.target_irr}%</span>
                  </div>
                )}
              </div>

              {!sent ? (
                <button
                  onClick={() => handleGetInTouch(contactTarget)}
                  disabled={sending}
                  className="w-full py-3 bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Mail className="w-4 h-4" /> Notify the Team</>}
                </button>
              ) : (
                <button onClick={() => setContactTarget(null)} className="w-full py-3 bg-[#0B1120] hover:bg-gray-800 text-white font-bold rounded-xl transition-colors text-sm cursor-pointer">
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
