"use client";

import Link from "next/link";
import {
  Users,
  TrendingUp,
  Bus,
  Target,
  ArrowRight,
  GraduationCap,
  Rocket,
  Briefcase,
  Zap,
  Scale,
  HeartHandshake,
  CheckCircle2,
  Building2,
  CalendarCheck,
  Share2,
  Eye,
  Navigation,
  BarChart2,
  ShieldCheck,
  BadgePercent,
  FileCheck,
  Layers,
  User
} from "lucide-react";

const teamMembers = [
  {
    name: "B Siva Prasad Naik",
    background: "IIT Guwahati",
    batch: "2018 Batch",
    spotlight: "rgba(5,206,120,0.18)",
    letterGradient: "linear-gradient(135deg, #05CE78 0%, #34d399 50%, #05CE78 100%)",
    borderGradient: "linear-gradient(135deg, rgba(5,206,120,0.5), rgba(5,206,120,0.1) 60%, transparent)",
    glow: "0 0 0 1px rgba(5,206,120,0.5), 0 8px 40px rgba(5,206,120,0.25)",
    badgeBg: "rgba(5,206,120,0.1)",
    badgeBorder: "rgba(5,206,120,0.2)",
    badgeColor: "#05CE78",
  },
  {
    name: "Mukkoti Anil",
    background: "IIT Guwahati",
    batch: "2019 Batch",
    spotlight: "rgba(251,191,36,0.15)",
    letterGradient: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #f59e0b 100%)",
    borderGradient: "linear-gradient(135deg, rgba(251,191,36,0.5), rgba(251,191,36,0.1) 60%, transparent)",
    glow: "0 0 0 1px rgba(251,191,36,0.5), 0 8px 40px rgba(251,191,36,0.25)",
    badgeBg: "rgba(251,191,36,0.1)",
    badgeBorder: "rgba(251,191,36,0.2)",
    badgeColor: "#fbbf24",
  },
  {
    name: "Purna Chandra Rao",
    background: "LPU",
    batch: "2018 Batch",
    spotlight: "rgba(96,165,250,0.15)",
    letterGradient: "linear-gradient(135deg, #3b82f6 0%, #93c5fd 50%, #3b82f6 100%)",
    borderGradient: "linear-gradient(135deg, rgba(96,165,250,0.5), rgba(96,165,250,0.1) 60%, transparent)",
    glow: "0 0 0 1px rgba(96,165,250,0.5), 0 8px 40px rgba(96,165,250,0.25)",
    badgeBg: "rgba(96,165,250,0.1)",
    badgeBorder: "rgba(96,165,250,0.2)",
    badgeColor: "#60a5fa",
  },
  {
    name: "Saanwra Khod",
    background: "IIT Guwahati",
    batch: "2017 Batch",
    spotlight: "rgba(167,139,250,0.15)",
    letterGradient: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 50%, #8b5cf6 100%)",
    borderGradient: "linear-gradient(135deg, rgba(167,139,250,0.5), rgba(167,139,250,0.1) 60%, transparent)",
    glow: "0 0 0 1px rgba(167,139,250,0.5), 0 8px 40px rgba(167,139,250,0.25)",
    badgeBg: "rgba(167,139,250,0.1)",
    badgeBorder: "rgba(167,139,250,0.2)",
    badgeColor: "#a78bfa",
  },
  {
    name: "B Uday Kumar",
    background: "IIT Guwahati",
    batch: "2018 Batch",
    spotlight: "rgba(34,211,238,0.15)",
    letterGradient: "linear-gradient(135deg, #06b6d4 0%, #67e8f9 50%, #06b6d4 100%)",
    borderGradient: "linear-gradient(135deg, rgba(34,211,238,0.5), rgba(34,211,238,0.1) 60%, transparent)",
    glow: "0 0 0 1px rgba(34,211,238,0.5), 0 8px 40px rgba(34,211,238,0.25)",
    badgeBg: "rgba(34,211,238,0.1)",
    badgeBorder: "rgba(34,211,238,0.2)",
    badgeColor: "#22d3ee",
  },
];

const stats = [
  { label: "Capital Deployed", value: "₹50 Cr+", icon: Briefcase },
  { label: "Fleet Size",       value: "34+",      icon: Bus       },
  { label: "Active Investors", value: "80+",      icon: Users     },
  { label: "Since",            value: "2023",     icon: Target    },
];

// Remaining investor stories (top 3 are showcased on the home page stack)
// earned/duration figures are sourced from real payout records (investor_quarterly_payments)
// for the matched investor accounts.
const moreInvestorStories = [
  { text: "The team's background from IIT gives me confidence. They treat operations like engineering problems.", author: "Nagasai B.", role: "Dev @ Google",   impact: "Invested in 2 Fleets",    stat: null, earned: "₹4.4 Lakh", duration: "2 Years 3 Months" },
  { text: "Tracking my bus fleet's location and daily revenue on the dashboard is total peace of mind.",          author: "Madan M.",   role: "Sr Dev, Florida", impact: "Active Dashboard User",   stat: null, earned: "₹2.4 Lakh", duration: "2 Years 1 Month" },
];

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900 selection:bg-[#05CE78] selection:text-white">

      {/* ── HERO ── */}
      <section className="relative bg-[#0B1120] pt-32 pb-48 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 80 80" fill="none">
            <path d="M0 0H80V80H0V0Z" fill="url(#grid-about)" />
            <defs>
              <pattern id="grid-about" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M1 0V40M0 1H40" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
          </svg>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#05CE78] text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-md">
            <Rocket className="w-3 h-3" /> Founded by IIT Alumni
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-300 drop-shadow-2xl">Building Scalable</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] via-emerald-300 to-[#05CE78]">
              High-Yield Business Models
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Founded in August 2023 by passionate IIT Guwahati alumni, <strong className="text-white">Hustlers Ventures</strong> is transforming industries by bringing institutional-grade execution to Transportation, Hospitality, and F&B.
          </p>
        </div>
      </section>

      {/* ── FLOATING STATS CARD ── */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        <div
          className="bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/60 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100/60"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.8) inset' }}
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center pt-4 md:pt-0">
              <div className="text-4xl font-extrabold text-gray-900 mb-2">{stat.value}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                <stat.icon className="w-4 h-4 text-[#05CE78]" />
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STORY & VISION ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-6 border border-[#05CE78]/20">
                <TrendingUp className="w-3 h-3" /> Our Story
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                From 2 Buses to a <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-600">Multi-Asset Ecosystem</span>
              </h2>
              <div className="prose prose-lg text-gray-600">
                <p className="mb-6">
                  In August 2023, we started with a simple hypothesis: <strong>Transportation is broken because it lacks data-driven execution.</strong> We deployed two buses between Tirupati and Hyderabad to test our operational playbooks.
                </p>
                <p className="mb-6">
                  The result? We didn't just survive; we dominated. Today, with a fleet of 34+, we have proven that <strong>operational rigor scales.</strong>
                </p>
                <div className="bg-gray-50 border-l-4 border-[#05CE78] p-6 shadow-sm rounded-r-xl">
                  <p className="font-medium text-gray-900 italic">
                    "Our goal for 2026 is ambitious but calculated: Expanding our 'Operating System' into Hospitality (Zostel) and Highway F&B chains."
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/opportunities" className="inline-flex items-center text-[#05CE78] font-bold gap-2 group hover:gap-3 transition-all">
                  See Our Current Assets <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Execution Code card */}
            <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#05CE78]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-[#05CE78]/15 border border-[#05CE78]/30 rounded-xl flex items-center justify-center text-[#05CE78]">
                  <Target className="w-5 h-5" />
                </div>
                The Execution Code
              </h3>
              <div className="space-y-7 relative z-10">
                {[
                  { title: "Surgical Precision",  desc: "We are engineers first. We optimize every route, every seat, and every rupee using data.", icon: Zap          },
                  { title: "Profitability First", desc: "Growth without profit is vanity. Every unit must be unit-economic positive from Day 1.", icon: Scale         },
                  { title: "Egoless Culture",     desc: "No corner offices. Just hard work, muddy boots, and a mission to build legacy assets.", icon: HeartHandshake }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#05CE78] shrink-0 border border-white/10">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{item.title}</h4>
                      <p className="text-gray-400 text-sm mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY FUND HOUSE ── */}
      <section className="bg-[#0B1120] py-16 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#05CE78]/8 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[150px] bg-[#05CE78]/6 blur-[60px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-6 border border-[#05CE78]/20">
            <Building2 className="w-4 h-4" /> Our Identity
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            We are building a <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] via-emerald-300 to-[#05CE78]">Community-Based Fund House</span>
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            We believe wealth creation shouldn't be a solo journey. We are creating an ecosystem where a community of like-minded investors can pool resources to own <strong className="text-white">high-ticket, tangible assets</strong> that were previously accessible only to ultra-HNIs.
          </p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {[
              { title: "Pooled Capital",   desc: "Aggregating small ticket sizes to buy massive assets." },
              { title: "Shared Ownership", desc: "You don't just invest; you co-own the asset with us." },
              { title: "Transparency",     desc: "Real-time P&L access for every community member."     }
            ].map((item, i) => (
              <div
                key={i}
                className="group relative rounded-2xl p-px transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(5,206,120,0.4), rgba(5,206,120,0.05) 60%, transparent)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                <div className="bg-[#0B1120] rounded-2xl p-5 h-full">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#05CE78]" /> {item.title}
                  </h4>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE STAND FOR ── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-4 border border-[#05CE78]/20">
              <CheckCircle2 className="w-3 h-3" /> Our Principles
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Things That Define{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-600">How We Operate</span>
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Not promises on a pitch deck. These are operational commitments baked into every asset we run.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
            {[
              {
                icon: CalendarCheck,
                title: "Quarterly Payouts",
                desc: "Returns credited every quarter. No waiting for an exit event or liquidity window.",
              },
              {
                icon: Share2,
                title: "Co-ownership, Not a Fund",
                desc: "You own a fractional stake in the actual business asset, not units in a pooled vehicle.",
              },
              {
                icon: GraduationCap,
                title: "IIT Alumni Operators",
                desc: "We don't just invest. We run the operations ourselves with engineering precision.",
              },
              {
                icon: Eye,
                title: "Full P&L Transparency",
                desc: "Every investor gets real-time access to operational data and periodic financial reports.",
              },
              {
                icon: Navigation,
                title: "On-Ground Execution",
                desc: "Mud on the boots. Our team operates the fleet and kitchens, not just spreadsheets.",
              },
              {
                icon: BarChart2,
                title: "Data-Driven Decisions",
                desc: "Every route, seat, and kitchen throughput is optimized using live operational data.",
              },
              {
                icon: ShieldCheck,
                title: "Zero Hidden Fees",
                desc: "No fund management layer skimming returns. Operator economics are fully disclosed.",
              },
              {
                icon: Layers,
                title: "Diversified Verticals",
                desc: "Spread across Transportation, Hospitality, F&B, and Debt for natural portfolio balance.",
              },
              {
                icon: BadgePercent,
                title: "20%+ Target IRR",
                desc: "Every asset is underwritten with above-market return expectations from Day 1.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 group">
                <div
                  className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(5,206,120,0.08)', border: '1px solid rgba(5,206,120,0.15)' }}
                >
                  <item.icon className="w-5 h-5 text-[#05CE78]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-base mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── TEAM — premium founder cards (no photos) ── */}
      <section className="bg-gray-50 py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-4 border border-[#05CE78]/20">
              <Users className="w-3 h-3" /> Core Team
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Built by{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-600">Engineers</span>
            </h2>
            <p className="text-gray-500 leading-relaxed">
              IIT alumni who swapped academia for operational hustle, turning unorganized sectors into institutional-grade assets.
            </p>
          </div>

          {/* 5 horizontal cards — 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="group relative rounded-2xl p-px cursor-default transition-all duration-300 hover:-translate-y-1"
                style={{ background: member.borderGradient, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = member.glow; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
              >
                <div className="relative bg-[#080e1a] rounded-2xl px-5 py-5 flex items-center gap-4 overflow-hidden">
                  {/* Radial spotlight from left */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `radial-gradient(ellipse 100% 140% at 0% 50%, ${member.spotlight} 0%, transparent 65%)`
                  }} />

                  {/* Ghost index — decorative */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl font-black leading-none select-none pointer-events-none"
                    style={{ color: 'rgba(255,255,255,0.03)' }}>
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  {/* Number badge */}
                  <div
                    className="relative z-10 w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-sm font-black"
                    style={{ background: member.badgeBg, color: member.badgeColor, border: `1px solid ${member.badgeBorder}` }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  {/* Info */}
                  <div className="relative z-10 min-w-0">
                    <h3 className="text-white font-bold text-base leading-snug mb-2">{member.name}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border"
                        style={{ background: member.badgeBg, borderColor: member.badgeBorder, color: member.badgeColor }}
                      >
                        <GraduationCap className="w-3 h-3" />
                        {member.background}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-gray-400">
                        {member.batch}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MORE INVESTOR STORIES ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-4 border border-[#05CE78]/20">
              <Users className="w-3 h-3" /> More Investor Stories
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Hear From{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-600">More of Our Investors</span>
            </h2>
            <p className="text-gray-500 leading-relaxed">
              A few more voices from our community of 80+ forward-thinking professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {moreInvestorStories.map((story, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 flex flex-col border border-gray-100"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)" }}
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
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0B1120] py-16 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#05CE78]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold uppercase tracking-wider mb-6 border border-[#05CE78]/20">
            <Rocket className="w-3 h-3" /> Join the Community
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Invest <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] via-emerald-300 to-[#05CE78]">with Us?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Join a community of 80+ active investors building wealth through tangible, high-yield assets.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/opportunities"
              className="bg-[#05CE78] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#04b067] transition-all hover:-translate-y-1 shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] flex items-center justify-center gap-2"
            >
              View Opportunities <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center gap-2"
            >
              Contact Team
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
