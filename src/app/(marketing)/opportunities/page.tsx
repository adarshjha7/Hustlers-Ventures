import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatCurrencyCompact } from "@/lib/formatters";

// Without this, Next.js statically caches this page indefinitely (only regenerating on
// a new deploy) since it has no other dynamic APIs - admin edits to categories (name,
// sort order, image, risk level, etc.) would never show up live otherwise.
export const revalidate = 60;

// Accent border per slug — pure CSS config, not worth a DB column
const SLUG_ACCENT: Record<string, string> = {
  transportation:       "hover:border-blue-200",
  fnb:                  "hover:border-orange-200",
  hospitality:          "hover:border-emerald-200",
  "hustlers-portfolio": "hover:border-purple-200",
  "debt-funds":         "hover:border-cyan-200",
};

const VOLATILITY_STYLES: Record<string, string> = {
  Low:    "bg-green-500/90 text-white",
  Medium: "bg-amber-500/90 text-white",
  High:   "bg-red-500/90 text-white",
};

async function getData() {
  const [catResult, oppResult] = await Promise.all([
    supabaseAdmin
      .from("opportunity_categories")
      .select("id, name, slug, description, sort_order, image_url, volatility_level")
      .eq("is_active", true)
      .order("sort_order"),

    supabaseAdmin
      .from("opportunities")
      .select("id, category_id, min_investment, target_irr, status")
      .eq("is_public", true)
      .in("status", ["active", "coming_soon"]),
  ]);

  return {
    categories: catResult.data ?? [],
    opportunities: oppResult.data ?? [],
  };
}

export default async function OpportunitiesPage() {
  const { categories, opportunities } = await getData();

  // Aggregate stats per category
  const statsByCategory = categories.map((cat) => {
    const catOpps = opportunities.filter((o) => o.category_id === cat.id);
    const activeCount = catOpps.filter((o) => o.status === "active").length;
    const comingSoonCount = catOpps.filter((o) => o.status === "coming_soon").length;
    const minEntry = catOpps
      .map((o) => Number(o.min_investment ?? 500000))
      .filter(Boolean)
      .sort((a, b) => a - b)[0];
    const irrs = catOpps.map((o) => Number(o.target_irr ?? 23)).filter(Boolean);
    const irrRange =
      irrs.length > 0
        ? irrs.length === 1
          ? `${irrs[0]}%`
          : `${Math.min(...irrs)}%–${Math.max(...irrs)}%`
        : null;

    return {
      ...cat,
      activeCount,
      comingSoonCount,
      minEntry: minEntry ?? 500000,
      irrRange: irrRange ?? "23%",
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-[#05CE78] selection:text-white pb-20">

      {/* HERO */}
      <div className="relative bg-[#0B1120] pt-20 pb-48 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 80 80" fill="none">
            <path d="M0 0H80V80H0V0Z" fill="url(#grid-pattern)" />
            <defs>
              <pattern id="grid-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M1 0V20M0 1H20" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
          </svg>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#05CE78]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#05CE78] text-xs font-bold tracking-wider uppercase mb-8">
            <Sparkles className="w-3 h-3" />
            Curated Investment Opportunities
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Build Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-400">
              Legacy Portfolio
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Institutional-grade assets in Transportation, F&B, and Hospitality.
            High-yield returns managed by industry veterans.
          </p>
        </div>
      </div>

      {/* CATEGORY CARDS */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        {statsByCategory.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            No active opportunities at the moment. Check back soon.
          </div>
        ) : (
          <div className={`grid gap-8 ${statsByCategory.length <= 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : statsByCategory.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"}`}>
            {statsByCategory.map((cat) => {
              const accentBorder = SLUG_ACCENT[cat.slug] ?? "hover:border-gray-200";
              const hasActive = cat.activeCount > 0;

              return (
                <div
                  key={cat.id}
                  className={`group bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-900/10 hover:shadow-[0_20px_60px_rgba(5,206,120,0.18),0_0_0_1px_rgba(5,206,120,0.12)] hover:-translate-y-3 transition-all duration-500 ease-out flex flex-col overflow-hidden relative ${accentBorder} hover:border-[#05CE78]/40`}
                >
                  {/* Card image */}
                  <div className="h-48 relative overflow-hidden bg-[#0B1120]">
                    {cat.image_url ? (
                      <>
                        <Image
                          src={cat.image_url}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20 text-4xl font-black select-none">
                        {cat.name[0]}
                      </div>
                    )}
                    {/* Volatility badge — bottom-left */}
                    {cat.volatility_level && (
                      <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${VOLATILITY_STYLES[cat.volatility_level] ?? "bg-gray-500/90 text-white"}`}>
                        {cat.volatility_level} Risk
                      </div>
                    )}
                  </div>

                  {/* Live / Coming Soon badge — outside overflow-hidden image div so it isn't clipped */}
                  {hasActive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#05CE78]/20 border border-[#05CE78]/40 text-[#05CE78] text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#05CE78] animate-pulse" />
                      {cat.activeCount} Live
                    </div>
                  )}
                  {!hasActive && cat.comingSoonCount > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
                      Coming Soon
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{cat.name}</h3>

                    <p className="text-gray-500 text-sm mb-6 leading-relaxed flex-1 line-clamp-3">
                      {cat.description ?? "High-yield real-world assets co-owned by investors."}
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-gray-100 mb-5 rounded-lg px-1">
                      <div className="text-center border-r border-gray-200">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                          Min Entry
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrencyCompact(cat.minEntry)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                          <TrendingUp className="w-3 h-3" /> Target IRR
                        </div>
                        <div className="text-sm font-bold text-[#05CE78]">
                          {cat.irrRange ?? "—"}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/opportunities/${cat.slug}`}
                      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 bg-gray-900 hover:bg-[#05CE78] text-white shadow-lg shadow-gray-200 mt-auto"
                    >
                      View Opportunities <ArrowRight className="w-4 h-4" />
                    </Link>
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
