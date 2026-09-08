"use client";

import Link from "next/link";
import React from "react";
import { 
  ChevronLeft, 
  TrendingUp, 
  Wallet, 
  PieChart, 
  BarChart3, 
  CheckCircle2, 
  ShieldCheck, 
  LayoutGrid,
  Clock,
  ArrowRight,
  Bus,
  Utensils,
  BedDouble
} from "lucide-react";

// Import Timeline Component
import ProjectTimeline, { TimelineEvent } from "@/components/ProjectTimeline";

// --- Configuration Data ---
const ALPHA_DATA = {
  id: "hustlers-alpha",
  title: "Hustlers Alpha Fund",
  category: "Diversified Portfolio",
  description: "A risk-adjusted basket of high-yield assets. The Alpha Fund spreads capital across Transportation (40%), Highway F&B (30%), and Backpacking Hostels (30%) to deliver stable, recession-proof returns.",
  
  // Hero Stats
  heroMetrics: [
    { label: "Total Fund Size", value: "₹2.0 Cr" },
    { label: "Target Annual ROI", value: "24% - 28%", highlight: true },
    { label: "Payout Frequency", value: "Quarterly" },
  ],

  // Deal Terms
  dealTerms: [
    { label: "Min Investment", value: "₹20,00,000" },
    { label: "Lock-in Period", value: "12 Months" },
    { label: "Asset Backing", value: "100% Tangible Assets" },
    { label: "Entry Fee", value: "0% (Early Bird)" },
    { label: "Fund Status", value: "Open for Subscription" },
  ]
};

// --- TIMELINE DATA ---
const alphaTimeline: TimelineEvent[] = [
  {
    date: "Oct 2025",
    title: "Fund Subscription Opens",
    desc: "Private placement memorandum released. Capital raising begins for the ₹2 Cr tranche.",
    status: "completed"
  },
  {
    date: "Nov 2025",
    title: "Asset Deployment (Phase 1)",
    desc: "Procurement of 2 buses for Hyderabad-Bangalore route and lease signing for Jadcherla Pitstop.",
    status: "completed"
  },
  {
    date: "Jan 2026",
    title: "Asset Deployment (Phase 2)",
    desc: "Operational handover of Zostel Varanasi. Renovation and staffing complete.",
    status: "completed"
  },
  {
    date: "Feb 2026",
    title: "Portfolio Activation",
    desc: "All three asset classes (Bus, F&B, Hostel) fully operational and generating daily revenue.",
    status: "completed"
  },
  {
    date: "Jun 2026",
    title: "First Consolidated Payout",
    desc: "Investors receive the first quarterly dividend derived from the combined cash flows.",
    status: "upcoming"
  }
];

export default function HustlersAlphaPage() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-[#05CE78] selection:text-white pb-32">
      
      {/* --- FLOATING CTA --- */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center pointer-events-none pb-6 sm:pb-8">
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-2xl border border-gray-100 pointer-events-auto transition-transform hover:scale-105 active:scale-95">
          <Link
            href={`/opportunities/hustlers-portfolio/${ALPHA_DATA.id}/business-model`}
            className="flex items-center gap-3 bg-[#05CE78] text-white px-8 py-3.5 rounded-2xl font-bold text-lg shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] hover:bg-[#04b067] transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            View Portfolio Financials
          </Link>
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative bg-[#0B1120] pt-24 pb-48 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M0 0H80V80H0V0Z" fill="url(#grid-pattern)" />
             <defs>
               <pattern id="grid-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                 <path d="M1 0V40M0 1H40" stroke="white" strokeWidth="0.5" />
               </pattern>
             </defs>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/opportunities/hustlers-portfolio" 
            className="inline-flex items-center text-gray-400 hover:text-white font-medium transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> 
            Back to Portfolio List
          </Link>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              <LayoutGrid className="w-3 h-3" /> {ALPHA_DATA.category}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Hustlers <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-400">
                Alpha Fund
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
              {ALPHA_DATA.description}
            </p>
          </div>
        </div>
      </section>

      {/* --- METRICS CARD --- */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            
            {/* Value */}
            <div className="text-center md:text-left md:pr-4">
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">{ALPHA_DATA.heroMetrics[0].label}</div>
              <div className="text-4xl font-extrabold text-gray-900">{ALPHA_DATA.heroMetrics[0].value}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-[#05CE78] rounded-lg text-xs font-bold">
                 <CheckCircle2 className="w-3 h-3" /> Fully Structured
              </div>
            </div>

            {/* ROI */}
            <div className="text-center md:px-4 pt-6 md:pt-0">
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">{ALPHA_DATA.heroMetrics[1].label}</div>
              <div className="text-4xl font-extrabold text-[#05CE78]">{ALPHA_DATA.heroMetrics[1].value}</div>
              <div className="mt-2 text-xs text-gray-500 font-medium">
                Blended Portfolio Yield
              </div>
            </div>

            {/* Frequency */}
            <div className="text-center md:text-right md:pl-4 pt-6 md:pt-0">
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">{ALPHA_DATA.heroMetrics[2].label}</div>
              <div className="text-4xl font-extrabold text-gray-900">{ALPHA_DATA.heroMetrics[2].value}</div>
              <div className="mt-2 text-xs text-gray-500 font-medium">
                Consolidated Payout
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- PARTNER LOGOS --- */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Portfolio Sub-Brands</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { name: "IntrCity SmartBus", tag: "Transport", logo: "/brands/intrcity.png" },
              { name: "ZingBus", tag: "Transport", logo: "/brands/zingbus.png" },
              { name: "Zostel", tag: "Hospitality", logo: "/brands/zostel.png" },
              { name: "Jadcherla Pitstop", tag: "F&B", logo: null },
            ].map(({ name, tag, logo }) => (
              <div key={name} className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl border border-gray-200 bg-gray-50 min-w-[120px]">
                {logo ? (
                  <img src={logo} alt={name} className="h-10 w-auto max-w-[100px] object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[#05CE78]/10 border border-[#05CE78]/20 flex items-center justify-center">
                    <span className="text-[#05CE78] font-extrabold text-sm">J</span>
                  </div>
                )}
                <span className="text-xs font-bold text-gray-700 text-center">{name}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#05CE78]">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ASSET ALLOCATION (UNIQUE TO THIS PAGE) --- */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="mb-12 text-center md:text-left">
               <h2 className="text-3xl font-bold text-gray-900 mb-4">Capital Allocation</h2>
               <p className="text-gray-600 max-w-2xl">
                 Your investment is split across three distinct asset classes to balance risk. While buses provide high cash flow, hospitality delivers stable nightly revenue, and F&B ensures daily liquidity.
               </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
               
               {/* Asset 1 */}
               <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm hover:shadow-xl transition-shadow group">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                     <Bus className="w-7 h-7" />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-xl font-bold text-gray-900">Intercity Fleet</h3>
                     <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">40%</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                     High-utilization sleeper buses on the Hyderabad-Bangalore corridor.
                  </p>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                     Avg Yield: 24%
                  </div>
               </div>

               {/* Asset 2 */}
               <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm hover:shadow-xl transition-shadow group">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                     <Utensils className="w-7 h-7" />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-xl font-bold text-gray-900">Highway F&B</h3>
                     <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md">30%</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                     Jadcherla Pitstop franchise serving 800+ daily travelers.
                  </p>
                  <div className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                     Avg Yield: 30%
                  </div>
               </div>

               {/* Asset 3 */}
               <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm hover:shadow-xl transition-shadow group">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                     <BedDouble className="w-7 h-7" />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-xl font-bold text-gray-900">Hospitality</h3>
                     <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">30%</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                     Zostel Varanasi leasehold model with high foreign tourist occupancy.
                  </p>
                  <div className="text-xs font-bold text-green-600 uppercase tracking-wide">
                     Avg Yield: 28%
                  </div>
               </div>

            </div>
        </div>
      </section>

      {/* --- TIMELINE --- */}
      <ProjectTimeline data={alphaTimeline} title="Fund Roadmap" />

      {/* --- DEAL DETAILS --- */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Thesis */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 mb-4">
                   <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
                   <span className="text-[#05CE78] font-bold text-sm uppercase tracking-widest">Investment Thesis</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Why <span className="text-[#05CE78]">Diversification</span> Matters?
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Single-asset investments carry specific risks (e.g., fuel price hikes for buses or low tourism seasons for hostels). The Alpha Fund mitigates this by blending industries that have low correlation.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed mt-4">
                  When transport is steady, F&B peaks during holidays. When tourism booms, Zostel drives surplus returns. This smoothing effect ensures you get consistent quarterly payouts regardless of micro-market fluctuations.
                </p>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: ShieldCheck, title: "Risk Mitigation", desc: "Capital spread across 3 sectors protects against industry-specific downturns." },
                  { icon: PieChart, title: "Weighted Returns", desc: "Optimized allocation (40:30:30) to balance stability and high yield." },
                  { icon: LayoutGrid, title: "Single Dashboard", desc: "Track all 3 assets in one consolidated investor view." },
                  { icon: Clock, title: "Quarterly Payouts", desc: "Profits from all sources pooled and distributed every 3 months." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="mt-1 text-[#05CE78]">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#05CE78]" />
                  Fund Terms
                </h3>
                <div className="space-y-6">
                  {ALPHA_DATA.dealTerms.map((term, index) => (
                    <div key={index} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <span className="text-gray-500 text-sm font-medium">{term.label}</span>
                      <span className="text-gray-900 font-bold">{term.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#05CE78] mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-green-900 mb-1">Tranche 1 is Active</p>
                        <p className="text-xs text-green-700">
                          Allocations are filling fast. This is a limited ₹2Cr raise for the initial Alpha portfolio.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 bg-[#0B1120] text-white text-center px-4 relative overflow-hidden border-t border-gray-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[150px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Invest in the Alpha Fund
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            One Investment. Three Growth Engines. Secure your slot in the Hustlers Alpha Portfolio today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="https://wa.me/919000272020" target="_blank" rel="noopener noreferrer" className="bg-[#05CE78] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#04b067] transition-all shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] flex items-center justify-center gap-2">
              Secure a Slot on WhatsApp
            </a>
            <Link href={`/opportunities/hustlers-portfolio/${ALPHA_DATA.id}/business-model`} className="bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" /> Portfolio Simulator
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}