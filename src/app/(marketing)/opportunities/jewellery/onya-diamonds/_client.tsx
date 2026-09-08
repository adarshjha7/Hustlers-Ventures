"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle2,
  Lock,
  MessageCircle,
  CalendarDays,
  Images,
  Maximize2,
  Gem,
  ShieldCheck,
  BadgeCheck,
  BarChart3,
  ArrowRight,
  GraduationCap,
  Users,
  Store,
  RefreshCw,
  Globe,
  Zap,
  ExternalLink,
} from "lucide-react";
import { formatCurrencyCompact } from "@/lib/formatters";

const galleryImages = [
  { src: "/opportunities/jewellery/onya-diamonds/onya-diamonds-thumbnail.webp", label: "Onya Diamonds Store" },
  { src: "/opportunities/jewellery/onya-diamonds/Edgy.webp", label: "Edgy Collection" },
  { src: "/opportunities/jewellery/onya-diamonds/everyday_basics.webp", label: "Everyday Basics" },
];

const VOLATILITY_STYLES: Record<string, string> = {
  Low: "bg-green-500/90 text-white",
  Medium: "bg-amber-500/90 text-white",
  High: "bg-red-500/90 text-white",
};

interface Opp {
  title: string;
  tagline: string | null;
  description: string | null;
  min_investment: number | null;
  target_irr: number | null;
  tenure: string | null;
  total_pool_size: number | null;
  company_name: string | null;
  status: string;
  volatility_level: string | null;
  volatility_note: string | null;
  whatsapp_number: string | null;
}

export default function OnyaDiamondsClient({
  opp,
  filledPct,
}: {
  opp: Opp;
  filledPct: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const isActive = opp.status === "active";
  const isComingSoon = opp.status === "coming_soon";
  const isClosed = opp.status === "closed";

  const waNumber = opp.whatsapp_number ?? "919000272020";
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I'm interested in investing in ${opp.title}.`)}`;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") setCurrent(p => (p - 1 + galleryImages.length) % galleryImages.length);
      if (e.key === "ArrowRight") setCurrent(p => (p + 1) % galleryImages.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent(p => (p - 1 + galleryImages.length) % galleryImages.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent(p => (p + 1) % galleryImages.length); };

  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-[#05CE78] selection:text-white pb-32">

      {/* FLOATING ROI SIMULATOR BUTTON */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center pointer-events-none pb-6 sm:pb-8">
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-2xl border border-gray-100 pointer-events-auto transition-transform hover:scale-105 active:scale-95">
          <Link
            href="/opportunities/jewellery/onya-diamonds/roi-simulator"
            className="flex items-center gap-3 bg-[#05CE78] text-white px-8 py-3.5 rounded-2xl font-bold text-lg shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] hover:bg-[#04b067] transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            Simulate Your Returns
          </Link>
        </div>
      </div>

      {/* HERO */}
      <section className="relative bg-[#0B1120] pt-24 pb-48 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 80 80" fill="none">
            <path d="M0 0H80V80H0V0Z" fill="url(#grid-onya)" />
            <defs>
              <pattern id="grid-onya" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M1 0V40M0 1H40" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
          </svg>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/opportunities/jewellery"
            className="inline-flex items-center text-gray-400 hover:text-white text-sm font-medium mb-8 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Jewellery
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — title & tagline */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] rounded-full text-xs font-bold tracking-widest uppercase">
                  <Gem className="w-3 h-3" />
                  {isActive ? "Live Deal" : isComingSoon ? "Coming Soon" : "Closed"}
                </div>
                {opp.volatility_level && (
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${VOLATILITY_STYLES[opp.volatility_level] ?? "bg-gray-500/90 text-white"}`}>
                    {opp.volatility_level} Risk
                  </span>
                )}
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                {opp.title}
              </h1>

              {opp.tagline && (
                <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">{opp.tagline}</p>
              )}
            </div>

            {/* Right — Founder card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-5 mb-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#05CE78]/30 to-[#05CE78]/10 border-2 border-[#05CE78]/30 flex items-center justify-center">
                    <Gem className="w-9 h-9 text-[#05CE78]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#05CE78] rounded-full flex items-center justify-center">
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#05CE78]/10 border border-[#05CE78]/20 text-[#05CE78] text-xs font-bold tracking-wider uppercase mb-1.5">
                    <GraduationCap className="w-3 h-3" /> IIT Guwahati
                  </div>
                  <h2 className="text-xl font-extrabold text-white">Himani Yadav</h2>
                  <p className="text-[#05CE78] font-bold text-sm">Founder &amp; CEO, Onya</p>
                </div>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Himani founded Onya to bring ethical, lab-grown diamond jewellery to India's premium segment at accessible prices.
                With an engineering background from IIT Guwahati, she built a vertically integrated brand combining proprietary designs,
                IGI-certified stones, and a tech-driven retail experience across many stores in India.
              </p>
              <a
                href="https://onyadiamonds.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Globe className="w-3.5 h-3.5" /> Visit onyadiamonds.com <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS CARD */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-8 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y-0 md:divide-x divide-gray-100">
            {/* Total Project Value */}
            <div className="text-center md:text-left md:pr-4">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Total Project Value</div>
              <div className="text-3xl font-extrabold text-gray-900">
                {opp.total_pool_size ? formatCurrencyCompact(Number(opp.total_pool_size)) : "—"}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-[#05CE78] rounded-lg text-xs font-bold">
                <CheckCircle2 className="w-3 h-3" /> Inventory-Backed
              </div>
            </div>
            {/* Target IRR */}
            <div className="text-center md:px-4">
              <div className="flex items-center gap-2 justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-[#05CE78]" />
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Target IRR</span>
              </div>
              <div className="text-3xl font-extrabold text-[#05CE78]">
                {opp.target_irr ? "24-30%" : "—"}
              </div>
              {opp.volatility_note && <p className="text-xs text-gray-500 mt-1">{opp.volatility_note}</p>}
            </div>
            {/* Tenure */}
            <div className="text-center md:px-4">
              <div className="flex items-center gap-2 justify-center mb-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tenure</span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{opp.tenure ?? "—"}</div>
            </div>
            {/* Min Investment */}
            <div className="text-center md:text-right md:pl-4">
              <div className="flex items-center gap-2 justify-center md:justify-end mb-2">
                <Wallet className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Min. Investment</span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {opp.min_investment ? formatCurrencyCompact(Number(opp.min_investment)) : "—"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FUNDING PROGRESS */}
      {filledPct !== null && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pool Funding</span>
              <span className={`text-sm font-extrabold ${filledPct >= 100 ? "text-gray-500" : "text-[#05CE78]"}`}>
                {Math.round(filledPct)}% Funded
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${filledPct >= 100 ? "bg-gray-400" : "bg-[#05CE78]"}`}
                style={{ width: `${Math.min(100, filledPct)}%` }}
              />
            </div>
            {filledPct >= 100 && <p className="text-xs text-gray-400 mt-2 font-medium">This pool is fully funded.</p>}
          </div>
        </section>
      )}

      {/* WHY LAB-GROWN DIAMONDS */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-[#05CE78] text-xs font-bold tracking-widest uppercase mb-4">
              <Gem className="w-3 h-3" /> Market Thesis
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Lab-Grown Diamonds?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              The Indian jewellery market is undergoing a once-in-a-generation shift. Lab-grown diamonds offer identical physical properties at a fraction of the price — opening a massive new consumer segment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Chemically Identical to Mined Diamonds",
                desc: "Lab-grown diamonds have the same optical, physical, and chemical properties as mined diamonds — certified by IGI, GIA, and SGL. Consumers get the same product at 60–80% lower cost.",
                icon: BadgeCheck,
                color: "text-[#05CE78]",
                bg: "bg-green-50",
              },
              {
                title: "India's Premium Segment is Expanding",
                desc: "Rising incomes and aspirational spending are creating a massive tier-2/3 market for premium jewellery. Onya's price point sits perfectly between mass-market and luxury.",
                icon: TrendingUp,
                color: "text-[#05CE78]",
                bg: "bg-[#05CE78]/10",
              },
              {
                title: "Asset-Backed Investment",
                desc: "Your capital goes into real inventory (gold, platinum, diamonds) and store assets — you own them. The store runs on your assets, not just goodwill.",
                icon: ShieldCheck,
                color: "text-gray-700",
                bg: "bg-gray-100",
              },
              {
                title: "Quarterly Audits and Full Transparency",
                desc: "Joint quarterly stock verification, digital real-time inventory ledger accessible to you, and your right to appoint a CA for financial audits twice per year.",
                icon: RefreshCw,
                color: "text-gray-700",
                bg: "bg-gray-100",
              },
            ].map(({ title, desc, icon: Icon, color, bg }) => (
              <div key={title} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow flex gap-5">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0 mt-1`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* MARKET ADOPTION + INDUSTRY OUTLOOK */}
      <section className="py-24 bg-[#0B1120] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#05CE78]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/6 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 border border-[#05CE78]/20 text-[#05CE78] text-xs font-bold tracking-widest uppercase mb-4">
              <Globe className="w-3 h-3" /> Global Adoption
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Lab-Grown Diamond Adoption: India vs the World</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              India is at the beginning of a curve the US already ran. The gap is the opportunity.
            </p>
          </div>

          {/* Country comparison bars */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Lab-Grown Share of Diamond Jewellery Sales (2024)</p>
            <div className="space-y-5">
              {[
                { country: "United States",   pct: 50, flag: "🇺🇸", note: "~50% of engagement rings are lab-grown" },
                { country: "United Kingdom",  pct: 35, flag: "🇬🇧", note: "Fast-growing, millennial-driven" },
                { country: "China",           pct: 20, flag: "🇨🇳", note: "Surging post-2022 with D2C brands" },
                { country: "Middle East",     pct: 12, flag: "🌍", note: "Premium gifting segment adopting quickly" },
                { country: "India",           pct: 6,  flag: "🇮🇳", note: "Early stage — massive headroom to grow", highlight: true },
              ].map(({ country, pct, flag, note, highlight }) => (
                <div key={country}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{flag}</span>
                      <span className={`text-sm font-bold ${highlight ? "text-[#05CE78]" : "text-gray-200"}`}>{country}</span>
                      {highlight && <span className="text-xs px-2 py-0.5 rounded-full bg-[#05CE78]/20 border border-[#05CE78]/30 text-[#05CE78] font-bold">Where Onya Plays</span>}
                    </div>
                    <span className={`text-sm font-black tabular-nums ${highlight ? "text-[#05CE78]" : "text-gray-300"}`}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${highlight ? "bg-[#05CE78]" : "bg-white/30"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{note}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-6 border-t border-white/10 pt-4">Sources: GJEPC, Bain &amp; Company Global Diamond Report 2024, MVI Marketing</p>
          </div>

          {/* Key stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: "80–90%", label: "Global rough diamonds cut in India (Surat)", color: "text-white" },
              { value: "$1.7B+", label: "India's LGD exports in FY2024", color: "text-[#05CE78]" },
              { value: "60–80%", label: "Price advantage vs mined diamonds", color: "text-white" },
              { value: "25%+",  label: "Projected CAGR for India's LGD retail market (2024–30)", color: "text-[#05CE78]" },
            ].map(({ value, label, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <p className={`text-2xl font-black mb-1 ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 leading-snug">{label}</p>
              </div>
            ))}
          </div>

          {/* Where we're heading */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-[#05CE78]" />
              <h3 className="text-xl font-bold text-white">Where the Industry is Heading</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Government tailwinds",
                  desc: "The Indian government slashed import duty on LGD seeds from 5% to zero in the 2023 Union Budget — directly cutting production costs and boosting India's manufacturing competitiveness.",
                },
                {
                  title: "Mainstream brands entering",
                  desc: "Tanishq, Malabar Gold, and Kalyan Jewellers have launched LGD collections. Once a major brand normalises a category, retail adoption accelerates 3–5x within 2–3 years.",
                },
                {
                  title: "Millennial and Gen Z buyers",
                  desc: "India has 600M+ people under 35. This cohort prioritises ethics, value, and aesthetics over tradition — making LGD the natural choice for engagements, daily wear, and gifting.",
                },
                {
                  title: "Tier 2 and Tier 3 unlocking",
                  desc: "LGD's 60–80% price advantage makes diamond jewellery accessible beyond metros for the first time. Onya's price point and FOCO store model is purpose-built for this expansion.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-4">
                  <CheckCircle2 className="w-5 h-5 text-[#05CE78] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400 max-w-xl">
                India is the world's diamond manufacturing hub — and its domestic retail market is only beginning to reflect that. The brands that establish trust now will own the category for the next decade.
              </p>
              <a
                href="https://onyadiamonds.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#05CE78]/10 hover:bg-[#05CE78]/20 border border-[#05CE78]/30 text-[#05CE78] text-sm font-bold rounded-xl transition-colors shrink-0"
              >
                <Globe className="w-4 h-4" /> Explore Onya <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* INVESTMENT STRUCTURE + RETURN STRUCTURE */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">How Your Money Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">You fund the store. Onya runs it. You collect returns every month.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* ── LEFT: Investment Structure ── */}
            <div className="bg-[#0B1120] rounded-3xl p-8 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 border border-[#05CE78]/20 text-[#05CE78] text-xs font-bold tracking-widest uppercase mb-6 self-start">
                  <Wallet className="w-3 h-3" /> Investment Structure
                </div>
                <h3 className="text-xl font-bold text-white mb-2">FOCO Model</h3>
                <p className="text-gray-400 text-sm mb-8">Franchisee-Owned, Company-Operated. You own the assets. Onya runs the business.</p>

                {/* Steps */}
                <div className="space-y-4 flex-1">
                  {[
                    {
                      step: "01",
                      icon: Wallet,
                      title: "You Fund the Store",
                      detail: "70% goes into inventory (gold, diamonds, silver) — real assets you own. 30% covers store fit-out, security deposit, and franchise setup.",
                      color: "text-white",
                      bg: "bg-white/10",
                      border: "border-white/10",
                    },
                    {
                      step: "02",
                      icon: Store,
                      title: "Onya Operates Everything",
                      detail: "Staff, pricing, designs, marketing, daily ops — fully handled by Onya's team. Zero effort required from you.",
                      color: "text-[#05CE78]",
                      bg: "bg-[#05CE78]/10",
                      border: "border-[#05CE78]/20",
                    },
                    {
                      step: "03",
                      icon: TrendingUp,
                      title: "You Collect Monthly Returns",
                      detail: "MMG paid to your bank by the 15th of every month for 7 years. 2-year lock-in, then full exit rights.",
                      color: "text-[#05CE78]",
                      bg: "bg-[#05CE78]/10",
                      border: "border-[#05CE78]/20",
                    },
                  ].map(({ step, icon: Icon, title, detail, color, bg, border }) => (
                    <div key={step} className={`flex gap-4 bg-white/5 border ${border} rounded-2xl p-4`}>
                      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-gray-500">{step}</span>
                          <h4 className="text-sm font-bold text-white">{title}</h4>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Capital split bar */}
                <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Capital Allocation</p>
                  <div className="flex rounded-full overflow-hidden h-3 mb-2">
                    <div className="bg-[#05CE78]" style={{ width: "70%" }} />
                    <div className="bg-white/20" style={{ width: "30%" }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#05CE78] font-bold">70% Inventory (Asset)</span>
                    <span className="text-gray-400 font-bold">30% Store Setup</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Return Structure ── */}
            <div className="flex flex-col gap-4">

              {/* MMG formula card */}
              <div className="bg-[#05CE78] rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-widest uppercase mb-5">
                    <TrendingUp className="w-3 h-3" /> Return Structure
                  </div>
                  <h3 className="text-xl font-bold mb-2">Monthly MMG (Minimum Monthly Guarantee)</h3>
                  <p className="text-white/80 text-sm mb-6">You receive whichever is higher each month — guaranteed.</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/20 rounded-2xl p-4 text-center">
                      <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Floor Guarantee</p>
                      <div className="text-3xl font-extrabold">1%</div>
                      <p className="text-white/80 text-xs mt-1">of capital / month<br />(12% p.a. fixed)</p>
                    </div>
                    <div className="bg-white/20 rounded-2xl p-4 text-center">
                      <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Revenue Upside</p>
                      <div className="text-3xl font-extrabold">12%</div>
                      <p className="text-white/80 text-xs mt-1">of monthly net revenue<br />(if store performs)</p>
                    </div>
                  </div>

                  <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 text-center">
                    <p className="text-white font-bold text-sm">Monthly Payout = <span className="underline underline-offset-2">max</span>(1% of capital, 12% of revenue)</p>
                  </div>
                </div>
              </div>

              {/* Quick examples */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Examples</p>
                <div className="space-y-3">
                  {[
                    { invest: "₹1 Cr", floor: "₹1L/mo", upside: "₹1.8L/mo", rev: "₹15L revenue" },
                    { invest: "₹2 Cr", floor: "₹2L/mo", upside: "₹3.6L/mo", rev: "₹30L revenue" },
                    { invest: "₹5 Cr", floor: "₹5L/mo", upside: "₹6L/mo",  rev: "₹50L revenue" },
                  ].map(({ invest, floor, upside, rev }) => (
                    <div key={invest} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{invest} invested</p>
                        <p className="text-xs text-gray-400">{rev}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-[#05CE78]">{upside}</p>
                        <p className="text-xs text-gray-400">floor: {floor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


            </div>

          </div>
        </div>
      </section>

      {/* INVESTOR PROTECTION */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-[#05CE78] text-xs font-bold tracking-widest uppercase mb-4">
            <ShieldCheck className="w-3 h-3" /> Investor Protection
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Capital is Protected</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Onya's franchise structure is designed with strong investor safeguards built in at every layer.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "You Own the Inventory", desc: "All gold, platinum, and diamond inventory is legally owned by you — not Onya." },
            { title: "Jeweller's Block Insurance", desc: "Mandatory comprehensive insurance covering theft, burglary, fire, and transit risks on all inventory." },
            { title: "Guaranteed Monthly Returns", desc: "MMG is a non-reducible contractual obligation — paid even if store performance is below target." },
            { title: "Exit After 2 Years", desc: "Post lock-in, exit with inventory buyback at book value, depreciated furniture value, and deposit refund." },
            { title: "Quarterly Stock Audits", desc: "Joint physical verification every quarter. You can appoint a CA for financial audits twice annually." },
            { title: "IGI / GIA Certified Stones", desc: "Every diamond comes with a valid certification from internationally recognised labs. No uncertified stones allowed." },
            { title: "Hustlers Ventures Assurance", desc: "We take accountability for delays. Your returns are calculated from day one of your investment, not day one of operations." },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#05CE78] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PHOTO GALLERY */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold tracking-widest uppercase mb-3">
                <Images className="w-3 h-3" /> Photo Gallery
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Collection Showcase</h2>
            </div>
            <p className="text-sm text-gray-400">{galleryImages.length} photos &mdash; click to expand</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 aspect-[4/3]"
                onClick={() => { setCurrent(idx); setOpen(true); }}
              >
                <Image
                  src={img.src}
                  alt={img.label}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg border border-gray-100 text-center">
                  {img.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA SECTION */}
      <section className="py-24 bg-[#0B1120] text-white text-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          {isClosed ? (
            <>
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">This Pool is Fully Funded</h2>
              <p className="text-gray-400 text-lg mb-8">
                Allocation for {opp.title} has closed. Explore other active opportunities.
              </p>
              <Link href="/opportunities/jewellery"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition">
                View More Opportunities
              </Link>
            </>
          ) : isComingSoon ? (
            <>
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Launching Soon</h2>
              <p className="text-gray-400 text-lg mb-8">
                {opp.title} is opening for investment shortly. Reach out to express your interest and get early access.
              </p>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#05CE78] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#04b86c] transition-all shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)]">
                <MessageCircle className="w-5 h-5" /> Express Interest on WhatsApp
              </a>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-[#05CE78]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gem className="w-8 h-8 text-[#05CE78]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Own a Piece of India's Diamond Retail Future
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Slots are limited. Reach out to our team on WhatsApp to secure your position in the Onya Diamonds franchise.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#05CE78] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#04b86c] transition-all shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)]">
                  <MessageCircle className="w-5 h-5" /> Secure a Slot on WhatsApp
                </a>
                <Link href="/opportunities/jewellery"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition">
                  Explore More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      {open && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[99] p-4 animate-in fade-in duration-300"
          onClick={() => setOpen(false)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition p-3 bg-white/10 rounded-full hover:bg-white/20 z-[101]"
            onClick={e => { e.stopPropagation(); setOpen(false); }}>
            <X size={24} />
          </button>
          <button className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition hidden sm:flex" onClick={prev}>
            <ChevronLeft size={40} />
          </button>
          <div className="relative w-full max-w-5xl h-[85vh]" onClick={e => e.stopPropagation()}>
            <Image src={galleryImages[current].src} alt={galleryImages[current].label} fill sizes="100vw" className="object-contain" />
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 uppercase tracking-wide">
                {galleryImages[current].label} &bull; {current + 1} / {galleryImages.length}
              </span>
            </div>
          </div>
          <button className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition hidden sm:flex" onClick={next}>
            <ChevronRight size={40} />
          </button>
        </div>
      )}
    </div>
  );
}
