"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import InvestmentCalculator from "@/components/InvestmentCalculator";
import { formatCurrencyCompact } from "@/lib/formatters";
import {
  ArrowRight, TrendingUp, Building2,
  Camera, HelpCircle, Play,
  Users, Briefcase, Target,
  CalendarCheck, Share2, Eye, BadgePercent, ShieldCheck,
  GraduationCap, Lock, Bus, Hotel, User, Plus, Minus,
} from "lucide-react";

interface LiveOpportunity {
  id: string;
  title: string;
  tagline: string | null;
  tenure: string | null;
  image_url: string | null;
  min_investment: number | null;
  target_irr: number | null;
  computed_filled_pct: number | null;
  detail_url: string | null;
  volatility_level: string | null;
  status: string;
  opportunity_categories: { slug: string; name: string } | null;
}

const VOLATILITY_STYLES: Record<string, string> = {
  Low:    "bg-green-50/90 text-green-700 border-green-200",
  Medium: "bg-amber-50/90 text-amber-700 border-amber-200",
  High:   "bg-red-50/90 text-red-600 border-red-200",
};

const CATEGORY_BADGE: Record<string, string> = {
  transportation: "bg-blue-50 text-blue-700 border-blue-200",
  hospitality:    "bg-purple-50 text-purple-700 border-purple-200",
  fnb:            "bg-orange-50 text-orange-700 border-orange-200",
  "debt-funds":   "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// --- CONSTANTS & DATA ---

// 1. Brand Partners (Capital Deployed)
const brandPartners = [
  { name: "IntrCity",   logo: "/brands/intrcity.png",   width: 120 },
  { name: "ZingBus",   logo: "/brands/zingbus.png",    width: 110 },
  { name: "Zostel",    logo: "/brands/zostel.png",     width: 110 },
  { name: "FlixBus",   logo: "/brands/flixbus.png",    width: 110 },
  { name: "Terminal44", logo: "/brands/terminal44.png", width: 110 },
];

// 2. Investor Stories (flat — top 3 shown here; remaining stories live on the About page)
// earned/duration figures are sourced from real payout records (investor_quarterly_payments) for
// the matched investor accounts; Surya's has no confirmed account match, so it keeps the impact tag.
const investorStories = [
  { text: "Initially skeptical, but the dashboard visibility and consistent quarterly payouts won me over. The transparency is unmatched.", author: "Mevin M.", role: "VP Sales, Bhanzu",   impact: "18 Months Active",       stat: null, earned: "₹1.1 Lakh", duration: "1 Year 8 Months" },
  { text: "An alternative investment that delivers. Yield is significantly higher than commercial real estate.",                          author: "Rajiv A.", role: "Chef, California",    impact: "24% Annual ROI",          stat: "24%", earned: "₹9.8 Lakh", duration: "2 Years 10 Months" },
  { text: "Hustlers Ventures handles the hard part, maintenance and ops. It's truly passive income.",                                     author: "Surya D.", role: "SWE in USA",         impact: "Early Adopter (2023)",    stat: null, earned: "₹15.6 Lakh", duration: "2 Years 10 Months" },
];

const galleryImages = [
  { src: "/home/bus-exterior-1.png", caption: "Premium Sleeper Fleet" },
  { src: "/home/team-drivers.png", caption: "Experienced Captains" },
  { src: "/home/bus-interior.png", caption: "Best-in-Class Interiors" },
  { src: "/home/team-mechanics.png", caption: "24/7 Maintenance Ops" },
  { src: "/home/ops-team.png", caption: "Tech-Enabled Control" },
  { src: "/home/pitstop-fleet-parking.png", caption: "Peak Hour Fleet Docking" },
  { src: "/home/pitstop-kitchen-action.png", caption: "24/7 Kitchen Ops" },
  { src: "/home/zostel-rooftop-crowd.png", caption: "Community Vibe @ Zostel" },
  { src: "/home/zostel-housekeeping.png", caption: "Daily Deep Cleaning" }
];

// 3. Mock Dashboard Data (In-Built Live Payout Tracking hero card)
const mockAssetBreakdown = [
  { name: "SIMSA", type: "Transportation", invested: "₹15,78,947", payouts: "₹11,40,736", roi: "21%", returned: 72.2, icon: Bus },
  { name: "LT Hybrids", type: "Transportation", invested: "₹21,71,053", payouts: "₹3,71,050", roi: "21%", returned: 17.1, icon: Bus },
  { name: "Zostel Varanasi", type: "Hospitality", invested: "₹10,00,000", payouts: "₹1,37,500", roi: "33%", returned: 13.8, icon: Hotel },
];

const mockQuarterlyBars = [
  { q: "Q2-24", pct: 92 },
  { q: "Q3-24", pct: 62 },
  { q: "Q4-24", pct: 46 },
  { q: "Q1-25", pct: 32 },
  { q: "Q2-25", pct: 31 },
  { q: "Q3-25", pct: 15 },
  { q: "Q4-25", pct: 67 },
  { q: "Q1-26", pct: 100 },
  { q: "Q2-26", pct: 91 },
];

const mockPayoutTimeline = [
  { date: "30 Jul 2026", period: "Q2-2026", gross: "₹1,96,876", net: "₹1,51,284" },
  { date: "24 Apr 2026", period: "Q1-2026", gross: "₹3,08,125", net: "₹2,62,533" },
  { date: "15 Jan 2026", period: "Q4-2025", gross: "₹2,06,106", net: "₹2,06,106" },
];

// Matches the "80+ Active Investors" figure used elsewhere on the site
// (floating stats card, About page) — kept as one constant so the splash
// count-up never drifts out of sync with those.
const INVESTOR_COUNT = 80;

// --- COMPONENTS ---

// Full-screen intro splash shown on every load of the homepage — counts up
// (in a FIXED time regardless of how big the target number is — a count of
// 500 animates just as fast as a count of 80) from 1 to the live investor
// count, holds briefly, then fades to reveal the page beneath.
const SPLASH_COUNT_DURATION_MS = 1400; // fixed — never scale this by the target count

const InvestorCountSplash = () => {
  const [count, setCount] = useState(1);
  const [phase, setPhase] = useState<"counting" | "fading" | "done">("counting");

  // Body scroll is locked only while the splash is actually blocking the
  // page (i.e. still counting) — its own effect, keyed on phase, so it
  // reliably unlocks the moment we start fading. (Previously this lived in
  // the effect below and only reset on unmount, which never happens since
  // this component stays mounted and just renders null — that permanently
  // stuck the page at overflow:hidden after the first load.)
  useEffect(() => {
    if (phase !== "counting") {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;

    const runCountUp = (target: number) => {
      if (cancelled) return;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / SPLASH_COUNT_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setCount(Math.round(1 + eased * (target - 1)));
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setTimeout(() => setPhase("fading"), 450);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    fetch("/api/investors/count")
      .then(r => r.json())
      .then(d => runCountUp(Math.max(1, d.count || INVESTOR_COUNT)))
      .catch(() => runCountUp(INVESTOR_COUNT));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (phase !== "fading") return;
    const t = setTimeout(() => setPhase("done"), 600);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1120] transition-opacity duration-500 ${
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="relative w-9 h-9 shrink-0">
            <Image src="/logo.svg" alt="Hustlers Ventures" fill sizes="36px" className="object-contain" priority />
          </div>
          <div className="flex flex-col leading-none gap-1 text-left">
            <span className="text-xl font-extrabold tracking-tight text-white">HUSTLERS</span>
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/55 uppercase">Ventures</span>
          </div>
        </div>

        <p className="text-lg text-gray-400 italic mb-1">Family of</p>
        <p className="text-8xl sm:text-9xl font-black leading-none tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] via-emerald-300 to-[#05CE78]">
          {count}
        </p>
        <p className="text-lg text-gray-400 italic mt-1">Hustlers</p>
      </div>
    </div>
  );
};

const Marquee = ({ children, direction = "left", fadeColor = "from-white" }: { children: React.ReactNode, direction?: "left" | "right", fadeColor?: string }) => {
  return (
    <div className="relative w-full group overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r ${fadeColor} to-transparent z-10 pointer-events-none`} />
      <div className={`absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l ${fadeColor} to-transparent z-10 pointer-events-none`} />
      <div className="flex overflow-hidden">
        <div className="flex gap-6 animate-scroll group-hover:paused pl-6" style={{ animationDirection: direction === "right" ? "reverse" : "normal", width: "max-content" }}>
          <div className="flex gap-6 shrink-0">{children}</div>
          <div className="flex gap-6 shrink-0">{children}</div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function Home() {
  const [liveOpportunities, setLiveOpportunities] = useState<LiveOpportunity[]>([]);
  const [oppError, setOppError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [mockPanel, setMockPanel] = useState(0);
  const [openFaqIndices, setOpenFaqIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setMockPanel(p => (p + 1) % 3), 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setOppError(false);
      const delays = [0, 1000, 2000];
      for (let attempt = 0; attempt < delays.length; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, delays[attempt]));
        try {
          const res = await fetch("/api/opportunities/public");
          if (!res.ok) throw new Error("non-200");
          const data = await res.json();
          if (cancelled) return;
          const visible = (data.opportunities ?? []).filter((o: any) => o.status === "active" || o.status === "coming_soon");
          setLiveOpportunities(visible.slice(0, 3));
          return;
        } catch {
          if (attempt === delays.length - 1 && !cancelled) setOppError(true);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [retryCount]);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#05CE78] selection:text-white">
      <InvestorCountSplash />

      {/* Removed Fixed Ticker Div */}

      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-48 lg:pt-32 overflow-hidden bg-[#0B1120]">
        <div className="absolute inset-0 z-0">
          <Image src="/hero-bg.png" alt="Background" fill sizes="100vw" className="object-cover opacity-30 mix-blend-overlay" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/80 to-transparent" />
        </div>
        {/* Cinematic radial glow behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#05CE78] text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-md shadow-lg shadow-green-900/10">
            <Building2 className="w-3 h-3" /> Managed by IIT Alumni
          </div>
          {/* Brushed-metal title gradient */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-300 drop-shadow-2xl">Co-Own High-Yield</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] via-emerald-300 to-[#05CE78]">Real World Assets</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Invest in fractional ownership of Sleeper Buses, Zostel Hostels, and Restaurants. Backed by <strong className="text-white">In-house Tech</strong> &amp; <strong className="text-white">On-ground Hustle</strong>.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* Apple-style diffused glow CTA */}
            <Link href="/opportunities" className="bg-gradient-to-r from-[#05CE78] to-[#04b067] text-[#0B1120] px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-[0.98]">
              Explore Opportunities <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/about" className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition flex items-center justify-center backdrop-blur-md gap-2">
              <Play className="w-5 h-5 fill-current" /> How it Works
            </Link>
          </div>
        </div>
      </section>

      {/* --- FLOATING STATS CARD --- */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 mb-0">
        <div
          className="backdrop-blur-2xl rounded-2xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/30"
          style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(255,255,255,0.65)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {[
            { value: "₹50 Cr+",    label: "Assets Under Management", icon: Briefcase,  color: "#05CE78" },
            { value: "80+",        label: "Active Investors",  icon: Users,       color: "#3B82F6" },
            { value: "23%",        label: "Avg. Annual ROI",   icon: TrendingUp,  color: "#8B5CF6" },
            { value: "30%",        label: "Target IRR",        icon: Target,      color: "#F59E0B" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center py-4 md:py-0 px-4 sm:px-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${stat.color}14` }}
              >
                <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-none mb-1.5">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- BRAND LOGOS --- */}
      <section className="py-10 bg-gray-50 border-y border-gray-100">
        <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-7">
          Capital Deployed Across Market Leaders
        </p>
        <div className="flex flex-nowrap items-center justify-center gap-x-6 sm:gap-x-10 max-w-6xl mx-auto px-4 overflow-x-auto">
          {brandPartners.map((brand, i) => (
            <div key={i} className="relative h-12 w-28 sm:h-14 sm:w-36 shrink-0">
              <Image
                src={brand.logo}
                alt={`${brand.name} Logo`}
                fill
                className="object-contain"
                sizes="(min-resolution: 2dppx) 280px, 140px"
              />
            </div>
          ))}
        </div>
      </section>

      {/* --- MERGED IDENTITY & STATS CARD --- */}
      <section className="relative z-20 px-4 py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-900/20 border border-gray-100 overflow-hidden p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Left: The Identity */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-6">
                   <Users className="w-4 h-4" /> Who We Are
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                   India's First <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-600">
                     Community-Based Fund House
                   </span>
                </h2>

                <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                   We don't just run buses; we build wealth. We pool capital from a trusted community of <strong>80+ investors</strong> (IIT Alumni & Tech Professionals) to acquire high-value assets in Transportation & Hospitality.
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl">
                     <div className="w-8 h-8 bg-[#0B1120] rounded-full flex items-center justify-center text-white"><Building2 className="w-4 h-4" /></div>
                     <div><p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Model</p><p className="text-sm text-gray-900 font-bold">Co-Ownership</p></div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl">
                     <div className="w-8 h-8 bg-[#0B1120] rounded-full flex items-center justify-center text-white"><Users className="w-4 h-4" /></div>
                     <div><p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Community</p><p className="text-sm text-gray-900 font-bold">Invite-Only</p></div>
                  </div>
                </div>

                <div className="mt-8">
                   <Link href="/about" className="inline-flex items-center text-[#05CE78] font-bold hover:gap-2 transition-all group">
                      Read our full Vision Statement <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                   </Link>
                </div>
              </div>

              {/* Right: Profit Simulator */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#05CE78]/10 to-blue-500/10 rounded-3xl blur-2xl transform rotate-3" />
                <div className="relative">
                  <InvestmentCalculator />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- ACTIVE OPPORTUNITIES --- */}
      <section className="py-16 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Active Opportunities
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Open deals and upcoming opportunities. Secure your equity in high-yield assets.
            </p>

            <Link
              href="/opportunities"
              className="inline-flex items-center font-bold text-[#05CE78] bg-green-50/50 hover:bg-[#05CE78] hover:text-white border border-[#05CE78]/20 hover:border-transparent px-6 py-3 rounded-full transition-all duration-300 group"
            >
              View All Deals
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {liveOpportunities.length === 0 ? (
            <div className="text-center py-12">
              {oppError ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-gray-400 text-sm">Could not load opportunities.</p>
                  <button
                    onClick={() => setRetryCount(c => c + 1)}
                    className="text-sm font-bold text-[#05CE78] hover:text-[#04b86c] flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Try again
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Loading active opportunities…</p>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {liveOpportunities.map((opp) => {
                const filled = opp.computed_filled_pct ?? 0;
                const href = opp.detail_url ?? (opp.opportunity_categories ? `/opportunities/${opp.opportunity_categories.slug}` : "/opportunities");
                return (
                  <div
                    key={opp.id}
                    className="group bg-white rounded-3xl border border-gray-100 transition-all duration-500 flex flex-col overflow-hidden hover:-translate-y-1.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 20px 60px rgba(5,206,120,0.12), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(5,206,120,0.15)')} onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
                  >
                    {/* Image */}
                    <div className="relative w-full h-52 bg-gray-100 overflow-hidden">
                      {opp.image_url ? (
                        <Image
                          src={opp.image_url}
                          alt={opp.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#0B1120]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      {opp.status === "active" ? (
                        <div className="absolute top-3 right-3 bg-[#05CE78] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20 backdrop-blur-sm">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20 backdrop-blur-sm">
                          Coming Soon
                        </div>
                      )}
                      {opp.volatility_level && (
                        <div className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${VOLATILITY_STYLES[opp.volatility_level]}`}>
                          {opp.volatility_level} Risk
                        </div>
                      )}
                      {/* IRR hero at bottom of image */}
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <div>
                          <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Target IRR</p>
                          <p className="text-white text-3xl font-extrabold leading-none drop-shadow-lg">
                            {opp.target_irr ? `${opp.target_irr}%` : "—"}
                          </p>
                        </div>
                        {filled > 0 && (
                          <div className="text-right">
                            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Funded</p>
                            <p className="text-white text-lg font-extrabold leading-none">{Math.round(filled)}%</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      {/* Category badge */}
                      {opp.opportunity_categories && (
                        <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-lg border mb-3 ${CATEGORY_BADGE[opp.opportunity_categories.slug] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {opp.opportunity_categories.name}
                        </span>
                      )}

                      <h3 className="text-lg font-extrabold text-gray-900 mb-1 group-hover:text-[#05CE78] transition-colors leading-snug line-clamp-2">
                        {opp.title}
                      </h3>
                      {opp.tagline && (
                        <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">{opp.tagline}</p>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center divide-x divide-gray-100 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden mb-4 mt-auto">
                        <div className="flex-1 px-3 py-2.5 text-center">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Min</p>
                          <p className="text-sm font-extrabold text-gray-900">
                            {opp.min_investment ? formatCurrencyCompact(opp.min_investment) : "—"}
                          </p>
                        </div>
                        {opp.tenure && (
                          <div className="flex-1 px-3 py-2.5 text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Tenure</p>
                            <p className="text-sm font-extrabold text-gray-900">{opp.tenure}</p>
                          </div>
                        )}
                        <div className="flex-1 px-3 py-2.5 text-center">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">IRR</p>
                          <p className="text-sm font-extrabold text-[#05CE78]">
                            {opp.target_irr ? `${opp.target_irr}%` : "—"}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={href}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#05CE78] to-[#04b067] text-[#0B1120] font-bold text-sm transition-all text-center block shadow-[0_0_0_1px_rgba(5,206,120,0.25),0_0_20px_rgba(5,206,120,0.35),0_0_40px_rgba(5,206,120,0.12)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.35),0_0_30px_rgba(5,206,120,0.5),0_0_60px_rgba(5,206,120,0.2)] active:scale-[0.98]"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-12 md:hidden text-center">
            <Link
              href="/opportunities"
              className="inline-flex items-center justify-center font-bold text-gray-500 hover:text-[#05CE78] transition-colors text-sm"
            >
              See all active funds <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- In-Built Live Payout Tracking --- */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-[#0B1120]">
        <div className="absolute inset-0 opacity-[0.04] z-0" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Cinematic radial glow behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#05CE78] text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-md shadow-lg shadow-green-900/10">
                <GraduationCap className="w-3.5 h-3.5" /> Managed by IIT Alumni
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold leading-[1.1] tracking-tight mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-300 drop-shadow-2xl">In-Built Live</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] via-emerald-300 to-[#05CE78]">Payout Tracking</span>
              </h2>
              <p className="text-base text-gray-400 mb-8 max-w-lg leading-relaxed drop-shadow-md">
                Complete visibility from revenue generation to bank disbursal, backed by <strong className="text-white">Tech-Driven Portfolio Management </strong> &amp; <strong className="text-white"> Regular Audits </strong> for full transparency.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                {/* Apple-style diffused glow CTA */}
                <Link href="/opportunities" className="bg-gradient-to-r from-[#05CE78] to-[#04b067] text-[#0B1120] px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-[0.98]">
                  Explore Opportunities <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/about" className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition flex items-center justify-center backdrop-blur-md gap-2">
                  <Play className="w-5 h-5 fill-current" /> How it Works
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-lg">
                {[
                  { value: "₹15.58L+", label: "Paid Out To This Investor", color: "text-white" },
                  { value: "17", label: "Payouts On Time", color: "text-white" },
                  { value: "23.5%", label: "Latest Quarter ROI", color: "text-[#05CE78]" },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className={`text-2xl sm:text-3xl font-black tracking-tight leading-none mb-1.5 ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mock Browser Window */}
            <div className="w-full relative">
              <div className="flex items-center gap-2 mb-4 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#05CE78] opacity-75" />
                </span>
                </div>

              {/* Environmental floor shadow */}
              <div className="absolute -bottom-8 left-4 right-4 h-12 bg-black/50 blur-2xl rounded-full pointer-events-none" />
              <div className="relative bg-[#131B2C] border border-white/10 rounded-2xl overflow-hidden" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07)' }}>
                {/* Glass glare highlight */}
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/6 to-transparent pointer-events-none" />

                {/* Browser chrome */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 relative z-10">
                  <div className="flex gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1.5 bg-black/40 rounded-lg py-1.5 px-3 text-[10px] text-gray-500 font-mono">
                    <Lock className="w-2.5 h-2.5" />
                    {mockPanel === 0 && "portal.hustlersventures.in/dashboard"}
                    {mockPanel === 1 && "portal.hustlersventures.in/dashboard/portfolio"}
                    {mockPanel === 2 && "portal.hustlersventures.in/dashboard/payouts"}
                  </div>
                  <span className="shrink-0 text-[9px] font-bold text-[#05CE78] bg-[#05CE78]/10 border border-[#05CE78]/30 px-2 py-1 rounded-md">LIVE</span>
                </div>

                <div className="p-4 sm:p-5 relative z-10">
                  {/* Greeting (persistent header across views) */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">Good Afternoon, Hustler</h3>
                        <span className="text-[9px] text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono">INV-A1B2C3</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[9px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">2-Year Investor</span>
                        <span className="text-[9px] font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">₹45L+ Deployed</span>
                        <span className="text-[9px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">17 Payouts</span>
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">₹15L+ Earned</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#05CE78]/20 border border-[#05CE78]/30 flex items-center justify-center font-black text-[#05CE78] text-xs shrink-0">HV</div>
                  </div>

                  {/* View tabs */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {["Overview", "Assets", "Payouts"].map((tab, i) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setMockPanel(i)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          mockPanel === i ? "bg-[#05CE78] text-[#0B1120]" : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Panel container — fixed height so all 3 views render at the same size */}
                  <div className="min-h-[340px]">
                  {/* Panel 0: Overview */}
                  {mockPanel === 0 && (
                    <div className="animate-in fade-in duration-300">
                      <div className="bg-black/40 rounded-xl p-3 border border-white/5 mb-2">
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Capital Deployed</p>
                        <div className="flex items-end justify-between flex-wrap gap-2 mb-1.5">
                          <p className="text-xl sm:text-2xl font-black text-white">₹47,50,000</p>
                          <div className="flex flex-wrap gap-2 text-right">
                            <div className="bg-black/40 rounded-lg px-2 py-1">
                              <p className="text-[9px] font-bold text-[#05CE78]">ASSETS</p>
                              <p className="text-xs font-black text-white">3 <span className="text-[9px] text-gray-500 font-normal">0 exited</span></p>
                            </div>
                            <div className="bg-black/40 rounded-lg px-2 py-1">
                              <p className="text-[9px] font-bold text-blue-300">LAST PAYOUT</p>
                              <p className="text-xs font-black text-white">₹82,500</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="text-[9px] font-bold text-[#05CE78] bg-[#05CE78]/10 px-1.5 py-0.5 rounded">+₹15,58,102 earned</span>
                          <span className="text-[9px] font-bold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">₹91,184 in reserve</span>
                          <span className="text-[9px] font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">23.5% latest ROI</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-500 mb-1">
                          <span className="uppercase tracking-wider font-bold">Principal Earned Back</span>
                          <span className="font-bold text-[#05CE78]">32.8%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#05CE78] to-emerald-400 rounded-full" style={{ width: "32.8%" }} />
                        </div>
                      </div>

                      <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Payout History · 17 since Jun 2024</p>
                        <div className="space-y-2">
                          {[
                            { asset: "Zostel Varanasi", sub: "Quarterly Payout", date: "05 Aug 2026", amount: "+₹82,500", icon: Hotel },
                            { asset: "SIMSA", sub: "Quarterly Payout", date: "30 Jul 2026", amount: "+₹82,895", icon: Bus },
                            { asset: "LT Hybrids", sub: "Quarterly Payout", date: "30 Jul 2026", amount: "+₹44,764", icon: Bus },
                          ].map((payout, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                  <payout.icon className="w-3.5 h-3.5 text-gray-300" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] text-gray-200 font-bold truncate">{payout.asset}</p>
                                  <p className="text-[9px] text-gray-500">{payout.sub} · {payout.date}</p>
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-[#05CE78] shrink-0">{payout.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reinvest banner — only on Overview */}
                      <div className="mt-2 flex items-center gap-2 bg-[#05CE78]/10 border border-[#05CE78]/20 rounded-xl px-4 py-2">
                        <span className="text-[9px] font-bold text-[#0B1120] bg-[#05CE78] px-1.5 py-0.5 rounded">REINVEST</span>
                        <span className="text-[11px] text-gray-200 font-medium">Put your ₹15,58,102 in payouts to work</span>
                      </div>
                    </div>
                  )}

                  {/* Panel 1: Asset Breakdown */}
                  {mockPanel === 1 && (
                    <div className="animate-in fade-in duration-300 space-y-2">
                      {mockAssetBreakdown.map((asset, i) => (
                        <div key={i} className="bg-black/40 rounded-xl p-3 border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <asset.icon className="w-3.5 h-3.5 text-gray-300" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] text-gray-200 font-bold truncate">{asset.name}</p>
                                <p className="text-[9px] text-gray-500">{asset.type} · Active</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-[#05CE78] bg-[#05CE78]/10 px-1.5 py-0.5 rounded shrink-0">{asset.roi} ROI</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Invested</p>
                              <p className="text-xs font-black text-white">{asset.invested}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Lifetime Payouts</p>
                              <p className="text-xs font-black text-blue-300">{asset.payouts}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-gray-500 mb-1">
                            <span className="uppercase tracking-wider font-bold">Capital Returned</span>
                            <span className="font-bold text-[#05CE78]">{asset.returned}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#05CE78] to-emerald-400 rounded-full" style={{ width: `${asset.returned}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Panel 2: Payout Chart + History */}
                  {mockPanel === 2 && (
                    <div className="animate-in fade-in duration-300">
                      <div className="bg-black/40 rounded-xl p-3 border border-white/5 mb-2">
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Quarterly Payouts · Last 9 distributions</p>
                        <div className="flex items-end gap-2 h-14">
                          {mockQuarterlyBars.map((bar, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full rounded-sm" style={{
                                height: `${bar.pct * 0.5}px`,
                                background: i === mockQuarterlyBars.length - 2 ? '#05CE78' : `rgba(59,130,246,${0.3 + i * 0.07})`
                              }} />
                              <span className="text-[7px] text-gray-600 font-mono">{bar.q}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Payout History</p>
                        <div className="space-y-2">
                          {mockPayoutTimeline.map((row, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div>
                                <p className="text-[11px] text-gray-200 font-bold">{row.date}</p>
                                <p className="text-[9px] text-gray-500">{row.period} · Gross {row.gross}</p>
                              </div>
                              <span className="text-[11px] font-bold text-[#05CE78] shrink-0">{row.net}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Operational Gallery */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-6 border border-blue-100"><Camera className="w-3 h-3" /> Operational Reality</div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">See the Engine Room in Action</h2>
          <p className="text-lg text-gray-500">Real assets, real people, real execution.</p>
        </div>
        <Marquee direction="right" fadeColor="from-white">
          {galleryImages.map((img, index) => (
            <div key={index} className="flex-none w-[400px] aspect-[16/9] relative rounded-2xl overflow-hidden shadow-md group cursor-pointer">
              <Image src={img.src} alt="Gallery" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 translate-y-2 group-hover:translate-y-0 transition-transform"><h3 className="text-white font-bold text-lg">{img.caption}</h3></div>
            </div>
          ))}
        </Marquee>
      </section>

      {/* --- INVESTOR STORIES --- */}
      <section className="py-16 bg-gray-50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-100/40 via-transparent to-transparent pointer-events-none overflow-hidden" />

        <div className="relative z-10">

          <div className="text-center mb-10 px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-4 border border-[#05CE78]/20">
              <Users className="w-4 h-4" /> Investor Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Not Just Investors.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-600">Partners in Wealth.</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              80+ forward-thinking professionals who have moved beyond traditional fixed deposits.
            </p>
          </div>

          <div className="max-w-xl mx-auto px-4">
            {investorStories.map((story, i) => {
              const rotate = i % 2 === 0 ? -1 : 1;
              return (
                <div
                  key={i}
                  className="sticky"
                  style={{ top: `${88 + i * 14}px`, zIndex: i + 1 }}
                >
                  <div
                    className="bg-white rounded-2xl p-6 sm:p-7 flex flex-col border border-gray-100 mb-8"
                    style={{
                      boxShadow: "0 20px 40px -12px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
                      transform: `rotate(${rotate * 0.5}deg)`,
                      minHeight: 260,
                    }}
                  >
                    {/* Photo + Name/Designation, then amount earned on its own line */}
                    <div className="pb-4 mb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2.5 min-w-0 mb-2.5">
                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300 shrink-0">
                          <User className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{story.author}</p>
                          <p className="text-xs text-gray-400 truncate">{story.role}</p>
                        </div>
                      </div>
                      {story.earned ? (
                        <p className="text-xs font-bold text-[#05CE78]">
                          {story.earned} earned in {story.duration}
                        </p>
                      ) : (
                        <span className="inline-block text-xs font-bold text-[#05CE78] bg-green-50 border border-green-100 px-2 py-1 rounded-md">
                          {story.impact}
                        </span>
                      )}
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, s) => (
                        <svg key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-gray-600 text-sm leading-relaxed flex-1">
                      &ldquo;{story.text}&rdquo;
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Hustlers Ventures */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-4 border border-[#05CE78]/20">
              Why Us
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 leading-tight">
              What makes Hustlers Ventures different
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              Not a mutual fund. Not a startup bet. A co-ownership model built on real assets, real operations, and real returns.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: CalendarCheck,
                title: "Quarterly Payouts",
                desc: "Returns credited every quarter, not at some distant exit event. Passive income that actually shows up on schedule.",
              },
              {
                icon: Share2,
                title: "Co-ownership, Not a Fund",
                desc: "You own a fractional stake in the actual business asset, not units in a pooled vehicle with layers of fees.",
              },
              {
                icon: Eye,
                title: "Full P&L Transparency",
                desc: "Real-time dashboard access to operational data, route revenue, and periodic financial reports. No black boxes.",
              },
              {
                icon: BadgePercent,
                title: "20%+ Target IRR",
                desc: "Every asset is underwritten with above-market return expectations. We only launch what we'd invest in ourselves.",
              },
              {
                icon: ShieldCheck,
                title: "Hustlers Ventures Assurance",
                desc: "We take accountability for delays. Your returns are calculated from day one of your investment, not day one of operations.",
              },
              {
                icon: Users,
                title: "Invite-Only Community",
                desc: "Access is by referral or application. Every investor in the network has been vetted, keeping the community tight and the capital serious.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 group p-6 rounded-2xl border border-gray-100 hover:border-[#05CE78]/30 hover:shadow-md transition-all duration-300 bg-gray-50/50">
                <div
                  className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(5,206,120,0.08)', border: '1px solid rgba(5,206,120,0.15)' }}
                >
                  <item.icon className="w-5 h-5 text-[#05CE78]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-base mb-1.5">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 bg-[#0B1120] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-sm">Everything you need to know before investing.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 items-start">
            {[
              { q: "What is the minimum investment?", a: "Most assets allow entry starting from ₹5 Lakhs." },
              { q: "When do I get my payouts?", a: "Payouts are processed quarterly by the 10th of the month." },
              { q: "Is my capital guaranteed?", a: "Assets are insured and backed by hard collateral to minimize downside." },
              { q: "Can I exit early?", a: "Liquidity varies by fund tier. Standard Pools have a minimum lock-in of 1 year. The high-yield Alpha Fund (Min ₹25L) carries a 3-year lock-in to ensure maximum capital compounding." }
            ].map((faq, i) => {
              const isOpen = openFaqIndices.has(i);
              const toggle = () => setOpenFaqIndices(prev => {
                const next = new Set(prev);
                if (next.has(i)) next.delete(i); else next.add(i);
                return next;
              });
              return (
                <div
                  key={i}
                  onClick={toggle}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
                  aria-expanded={isOpen}
                  className="bg-white/5 border border-white/10 hover:border-[#05CE78]/30 transition-colors duration-200 rounded-xl p-5 cursor-pointer"
                >
                  <div className="w-full flex gap-3 items-start text-left">
                    <HelpCircle className="w-4 h-4 text-[#05CE78] shrink-0 mt-0.5" />
                    <span className="font-bold text-white text-sm flex-1">{faq.q}</span>
                    <span className="relative w-4 h-4 shrink-0 mt-0.5">
                      <Plus
                        className="absolute inset-0 w-4 h-4 text-[#05CE78] transition-all duration-300 ease-in-out"
                        style={{
                          opacity: isOpen ? 0 : 1,
                          transform: isOpen ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
                        }}
                      />
                      <Minus
                        className="absolute inset-0 w-4 h-4 text-[#05CE78] transition-all duration-300 ease-in-out"
                        style={{
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
                        }}
                      />
                    </span>
                  </div>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="text-gray-400 mt-2 ml-7 text-xs leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
