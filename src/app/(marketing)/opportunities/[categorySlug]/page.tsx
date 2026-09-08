import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Bus,
  Utensils,
  BedDouble,
  Briefcase,
  Landmark,
  ChevronLeft,
  TrendingUp,
  Wallet,
  ArrowRight,
  Lock,
  CheckCircle2,
  Clock,
  LucideIcon,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatCurrencyCompact } from "@/lib/formatters";
import type { Metadata } from "next";

// Without this, Next.js statically caches this page indefinitely (only regenerating on
// a new deploy) since it has no other dynamic APIs - admin edits to categories/
// opportunities (name, order, image, status, etc.) would never show up live otherwise.
export const revalidate = 60;

const SLUG_CONFIG: Record<
  string,
  { icon: LucideIcon; label: string; accentColor: string; heroGlow: string }
> = {
  transportation: {
    icon: Bus,
    label: "Fleet Assets",
    accentColor: "#3B82F6",
    heroGlow: "bg-blue-500",
  },
  fnb: {
    icon: Utensils,
    label: "F&B Assets",
    accentColor: "#F97316",
    heroGlow: "bg-orange-500",
  },
  hospitality: {
    icon: BedDouble,
    label: "Hospitality Assets",
    accentColor: "#05CE78",
    heroGlow: "bg-emerald-500",
  },
  "debt-funds": {
    icon: Landmark,
    label: "Debt Instruments",
    accentColor: "#06B6D4",
    heroGlow: "bg-cyan-500",
  },
};

const FALLBACK_CONFIG = {
  icon: Briefcase,
  label: "Investment Assets",
  accentColor: "#8B5CF6",
  heroGlow: "bg-purple-500",
};

async function getCategoryWithOpportunities(slug: string) {
  const { data: category } = await supabaseAdmin
    .from("opportunity_categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!category) return null;

  const { data: opportunities } = await supabaseAdmin
    .from("opportunities")
    .select(`
      id, title, slug, tagline, description, detail_url,
      min_investment, target_irr, tenure, total_pool_size, filled_pct,
      pool_id, company_name, image_url, status, sort_order,
      company_pools ( total_cost )
    `)
    .eq("category_id", category.id)
    .eq("is_public", true)
    .in("status", ["active", "coming_soon", "closed"])
    .order("sort_order")
    .order("created_at", { ascending: false });

  // Batch-fetch actual invested totals from investor_investments
  const poolIds = (opportunities ?? []).map((o: any) => o.pool_id).filter(Boolean) as string[];
  let investedByPool: Record<string, number> = {};
  if (poolIds.length > 0) {
    const { data: invData } = await supabaseAdmin
      .from("investor_investments")
      .select("purchase_id, total_amount")
      .in("purchase_id", poolIds);
    investedByPool = (invData ?? []).reduce((acc: Record<string, number>, row: any) => {
      acc[row.purchase_id] = (acc[row.purchase_id] ?? 0) + Number(row.total_amount);
      return acc;
    }, {});
  }

  const enriched = (opportunities ?? []).map((o: any) => {
    const totalCost = o.total_pool_size ?? o.company_pools?.total_cost;
    const investedTotal = o.pool_id ? (investedByPool[o.pool_id] ?? null) : null;
    const filledPct =
      o.filled_pct != null
        ? Number(o.filled_pct)
        : totalCost && investedTotal != null
          ? Math.min(100, (investedTotal / Number(totalCost)) * 100)
          : null;
    return {
      ...o,
      min_investment: o.min_investment ?? 500000,
      target_irr: o.target_irr ?? 23,
      computed_filled_pct: filledPct,
      company_pools: undefined,
    };
  });

  // Sort: active first, then coming_soon, then closed
  const ORDER = { active: 0, coming_soon: 1, closed: 2 };
  enriched.sort(
    (a, b) => (ORDER[a.status as keyof typeof ORDER] ?? 3) - (ORDER[b.status as keyof typeof ORDER] ?? 3)
  );

  return { category, opportunities: enriched };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const result = await getCategoryWithOpportunities(categorySlug);
  if (!result) return {};
  const { category } = result;
  return {
    title: `${category.name} Opportunities | Hustlers Ventures`,
    description:
      category.description ??
      `Browse ${category.name} investment opportunities with high-yield returns.`,
  };
}

export default async function CategoryOpportunitiesPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const result = await getCategoryWithOpportunities(categorySlug);
  if (!result) notFound();

  const { category, opportunities } = result;
  const cfg = SLUG_CONFIG[categorySlug] ?? FALLBACK_CONFIG;
  const Icon = cfg.icon;

  const activeCount = opportunities.filter((o) => o.status === "active").length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-[#05CE78] selection:text-white pb-20">

      {/* HERO */}
      <div className="relative bg-[#0B1120] pt-24 pb-48 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 80 80" fill="none">
            <path d="M0 0H80V80H0V0Z" fill="url(#grid-cat)" />
            <defs>
              <pattern id="grid-cat" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M1 0V40M0 1H40" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
          </svg>
        </div>
        <div
          className={`absolute top-0 right-0 w-[600px] h-[600px] ${cfg.heroGlow} opacity-10 blur-[120px] rounded-full pointer-events-none`}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/opportunities"
            className="inline-flex items-center text-gray-400 hover:text-white text-sm font-medium mb-8 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to All Opportunities
          </Link>

          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold tracking-wider uppercase mb-6"
              style={{ color: cfg.accentColor }}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              {category.name}
            </h1>

            {category.description && (
              <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mb-8">
                {category.description}
              </p>
            )}

            {activeCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#05CE78]/10 border border-[#05CE78]/20 text-[#05CE78] text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#05CE78] animate-pulse" />
                {activeCount} Live Deal{activeCount !== 1 ? "s" : ""} Available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPPORTUNITY CARDS */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        {opportunities.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-16 text-center">
            <p className="text-gray-500 text-lg font-medium">No opportunities listed yet.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon or{" "}
              <Link href="/contact" className="text-[#05CE78] underline underline-offset-2">reach out to us</Link>.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opp) => {
              const isClosed = opp.status === "closed";
              const isComingSoon = opp.status === "coming_soon";
              const isActive = opp.status === "active";
              const filledPct = opp.computed_filled_pct;

              return (
                <div
                  key={opp.id}
                  className={`group bg-white rounded-3xl overflow-hidden transition-all duration-500 flex flex-col h-full relative
                    ${isClosed
                      ? "border border-gray-200 opacity-90 grayscale-[0.7] hover:grayscale-0 shadow-sm"
                      : "border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-[0_20px_60px_rgba(5,206,120,0.18),0_0_0_1px_rgba(5,206,120,0.12)] hover:-translate-y-2 hover:border-[#05CE78]/40"
                    }`}
                >
                  {/* Image */}
                  <div className="relative w-full h-56 bg-[#0B1120] overflow-hidden">
                    {opp.image_url ? (
                      <Image
                        src={opp.image_url}
                        alt={opp.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-16 h-16 text-white/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-4 right-4 z-10">
                      {isClosed && (
                        <span className="bg-gray-900/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/10">
                          <Lock className="w-3 h-3" /> FULLY FUNDED
                        </span>
                      )}
                      {isComingSoon && (
                        <span className="bg-amber-500/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                          <Clock className="w-3 h-3" /> COMING SOON
                        </span>
                      )}
                      {isActive && (
                        <span className="bg-[#05CE78] text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                          <CheckCircle2 className="w-3 h-3" /> LIVE DEAL
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-0 left-0 p-5 w-full">
                      <h2 className="text-xl font-bold text-white leading-tight">{opp.title}</h2>
                      {opp.tagline && (
                        <p className="text-sm text-gray-300 mt-1 line-clamp-1">{opp.tagline}</p>
                      )}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-6 flex flex-col flex-1">

                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-2 py-4 mb-5 border-b border-gray-100 text-center">
                      <div className="border-r border-gray-100 flex flex-col items-center">
                        <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                          <TrendingUp className="w-3 h-3 mr-0.5" /> IRR
                        </div>
                        <div className="text-lg font-bold text-[#05CE78]">
                          {opp.target_irr ? `${opp.target_irr}%` : "—"}
                        </div>
                      </div>
                      <div className="border-r border-gray-100 flex flex-col items-center">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                          Tenure
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {opp.tenure ?? "—"}
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                          <Wallet className="w-3 h-3 mr-0.5" /> Min
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {opp.min_investment ? formatCurrencyCompact(Number(opp.min_investment)) : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Fill progress */}
                    {filledPct !== null && (
                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-gray-500 font-medium">
                            {opp.total_pool_size
                              ? `Pool: ${formatCurrencyCompact(Number(opp.total_pool_size))}`
                              : "Allocation"}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              filledPct >= 100
                                ? "bg-gray-100 text-gray-500"
                                : "bg-green-50 text-[#05CE78]"
                            }`}
                          >
                            {Math.round(filledPct)}% Funded
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isClosed ? "bg-gray-400" : "bg-[#05CE78]"
                            }`}
                            style={{ width: `${Math.min(100, filledPct)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {opp.description && (
                      <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-2">
                        {opp.description}
                      </p>
                    )}

                    {/* CTA */}
                    <div className="mt-auto">
                      {isClosed ? (
                        opp.detail_url ? (
                          <Link
                            href={opp.detail_url}
                            className="w-full py-4 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 transition-all"
                          >
                            <Lock className="w-4 h-4" /> View Summary
                          </Link>
                        ) : (
                          <div className="w-full py-4 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gray-100 text-gray-400 border border-gray-200 cursor-default select-none">
                            <Lock className="w-4 h-4" /> Fully Funded
                          </div>
                        )
                      ) : isComingSoon ? (
                        <button
                          disabled
                          className="w-full py-4 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-amber-50 text-amber-600 border border-amber-200"
                        >
                          <Clock className="w-4 h-4" /> Details Coming Soon
                        </button>
                      ) : (
                        <Link
                          href={opp.detail_url ?? `/opportunities/${categorySlug}/${opp.slug}`}
                          className="w-full py-4 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-[#05CE78] shadow-lg shadow-gray-200 hover:shadow-green-900/20 transition-all active:scale-[0.98]"
                        >
                          View Deal Details <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
