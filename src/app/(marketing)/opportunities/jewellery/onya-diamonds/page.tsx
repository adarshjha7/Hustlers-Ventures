import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OnyaDiamondsClient from "./_client";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Onya Diamonds | Jewellery | Hustlers Ventures",
  description: "Invest in Onya Diamonds — a high-yield jewellery retail opportunity by Hustlers Ventures.",
};

export default async function Page() {
  const { data: opp } = await supabaseAdmin
    .from("opportunities")
    .select(`
      title, slug, tagline, description,
      min_investment, target_irr, tenure, total_pool_size, filled_pct,
      pool_id, company_name, status,
      volatility_level, volatility_note, whatsapp_number
    `)
    .eq("slug", "onya-diamonds")
    .single();

  let filledPct: number | null = null;
  if (opp) {
    if (opp.filled_pct != null) {
      filledPct = Number(opp.filled_pct);
    } else if (opp.pool_id) {
      const { data: invData } = await supabaseAdmin
        .from("investor_investments")
        .select("total_amount")
        .eq("purchase_id", opp.pool_id);
      const invested = (invData ?? []).reduce((s: number, r: any) => s + Number(r.total_amount), 0);
      if (invested > 0 && opp.total_pool_size)
        filledPct = Math.min(100, (invested / Number(opp.total_pool_size)) * 100);
    }
  }

  if (!opp) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Opportunity not found.</div>;

  return <OnyaDiamondsClient opp={opp} filledPct={filledPct} />;
}

// import Link from "next/link";
// import Image from "next/image";
// import {
//   ChevronLeft, TrendingUp, Wallet, ShieldCheck, CheckCircle2,
//   CalendarClock, Gem, BarChart3, Users, MessageCircle, Sparkles,
// } from "lucide-react";
// import ProjectTimeline, { TimelineEvent } from "@/components/ProjectTimeline";

// export const revalidate = 3600;

// const OPPORTUNITY = {
//   title: "Onya Diamonds",
//   category: "Jewellery",
//   tagline:
//     "Co-own a premium branded jewellery retail business. High-margin sales, quarterly profit distributions, and real inventory-backed security.",
//   heroMetrics: [
//     { label: "Total Pool Size", value: "₹X Crores", sub: "Equity Raise" },
//     { label: "Target Annual ROI", value: "XX–XX%", highlight: true, sub: "Revenue Share" },
//     { label: "Min. Investment", value: "₹X Lakhs", sub: "Quarterly Payouts" },
//   ],
//   dealTerms: [
//     { label: "Min Investment", value: "₹X,00,000" },
//     { label: "Pool Size (Equity)", value: "₹X Crores" },
//     { label: "Revenue Share", value: "XX% of net profits" },
//     { label: "Payout Frequency", value: "Quarterly" },
//     { label: "Tenure", value: "XX Months" },
//     { label: "Security", value: "Inventory-Backed" },
//     { label: "Fund Status", value: "Coming Soon" },
//   ],
// };

// const timeline: TimelineEvent[] = [
//   {
//     date: "Q3 2026",
//     title: "Investor Onboarding Opens",
//     desc: "Co-investor agreements executed. Capital pooled and deployed into inventory procurement.",
//     status: "upcoming",
//   },
//   {
//     date: "Q3 2026",
//     title: "Store Launch",
//     desc: "Onya Diamonds flagship outlet opens. Display inventory, staff, and POS systems operational.",
//     status: "upcoming",
//   },
//   {
//     date: "Q4 2026",
//     title: "First Quarterly Payout",
//     desc: "Q1 revenue share distributed to investor bank accounts based on audited net sales.",
//     status: "upcoming",
//   },
//   {
//     date: "Ongoing, Quarterly",
//     title: "Regular Profit Distributions",
//     desc: "Net profits shared every quarter throughout the investment tenure.",
//     status: "upcoming",
//   },
//   {
//     date: "TBD",
//     title: "Exit / Buyback",
//     desc: "Investors exit via promoter buyback or secondary sale at pre-agreed valuation.",
//     status: "upcoming",
//   },
// ];

// const highlights = [
//   {
//     icon: Gem,
//     title: "High-Margin Asset Class",
//     desc: "Jewellery retail operates at 25–40% gross margins — significantly higher than most consumer categories, creating strong headroom for investor returns.",
//   },
//   {
//     icon: ShieldCheck,
//     title: "Inventory-Backed Security",
//     desc: "Your capital is deployed into physical gold, diamond, and silver inventory — tangible assets that retain value independent of business performance.",
//   },
//   {
//     icon: CalendarClock,
//     title: "Quarterly Revenue Share",
//     desc: "Profits are distributed quarterly based on audited net sales — no waiting for an exit event. Regular income throughout the tenure.",
//   },
//   {
//     icon: TrendingUp,
//     title: "Brand Built for Scale",
//     desc: "Onya Diamonds is designed as a scalable retail brand — franchisable, digital-first, and positioned for multi-city expansion.",
//   },
//   {
//     icon: Users,
//     title: "Experienced Operations Team",
//     desc: "Led by founders with hands-on experience in jewellery sourcing, retail operations, and branded consumer businesses.",
//   },
//   {
//     icon: Sparkles,
//     title: "Premium Positioning",
//     desc: "Onya targets the aspirational mid-premium segment — high purchase frequency, strong repeat customer rates, and festival-driven demand spikes.",
//   },
// ];

// export default function OnyaDiamondsPage() {
//   return (
//     <div className="bg-gray-50 min-h-screen font-sans selection:bg-[#05CE78] selection:text-white pb-32">

//       {/* FLOATING CTA */}
//       <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center pointer-events-none pb-6 sm:pb-8">
//         <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-2xl border border-gray-100 pointer-events-auto transition-transform hover:scale-105 active:scale-95">
//           <a
//             href="https://wa.me/919000272020"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="flex items-center gap-3 bg-[#05CE78] text-white px-8 py-3.5 rounded-2xl font-bold text-lg shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] hover:bg-[#04b067] transition-all"
//           >
//             <MessageCircle className="w-5 h-5" />
//             Express Interest on WhatsApp
//           </a>
//         </div>
//       </div>

//       {/* HERO */}
//       <section className="relative bg-[#0B1120] pt-24 pb-48 overflow-hidden">
//         <div className="absolute inset-0 opacity-20 pointer-events-none">
//           <svg className="h-full w-full" viewBox="0 0 80 80" fill="none">
//             <path d="M0 0H80V80H0V0Z" fill="url(#grid-onya)" />
//             <defs>
//               <pattern id="grid-onya" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
//                 <path d="M1 0V40M0 1H40" stroke="white" strokeWidth="0.5" />
//               </pattern>
//             </defs>
//           </svg>
//         </div>
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
//         <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />

//         {/* Hero image strip */}
//         <div className="absolute inset-0 opacity-10 pointer-events-none">
//           <Image
//             src="/opportunities/jewellery/onya-diamonds.png"
//             alt="Onya Diamonds"
//             fill
//             sizes="100vw"
//             className="object-cover"
//             priority
//           />
//         </div>

//         <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <Link
//             href="/opportunities/jewellery"
//             className="inline-flex items-center text-gray-400 hover:text-white font-medium transition-colors mb-8 group text-sm"
//           >
//             <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
//             Back to Jewellery
//           </Link>

//           <div className="max-w-4xl">
//             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] rounded-full text-xs font-bold tracking-widest uppercase mb-6">
//               <Gem className="w-3 h-3" /> Jewellery · Revenue Share
//             </div>
//             <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
//               Onya{" "}
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-400">
//                 Diamonds
//               </span>
//             </h1>
//             <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
//               {OPPORTUNITY.tagline}
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* METRICS CARD */}
//       <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
//         <div className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-8 md:p-10">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
//             {OPPORTUNITY.heroMetrics.map((m, i) => (
//               <div
//                 key={i}
//                 className={`${
//                   i === 0 ? "md:pr-4" : i === 2 ? "md:pl-4 text-center md:text-right" : "text-center md:px-4"
//                 } pt-6 md:pt-0 first:pt-0`}
//               >
//                 <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">{m.label}</div>
//                 <div className={`text-4xl font-extrabold ${m.highlight ? "text-[#05CE78]" : "text-gray-900"}`}>
//                   {m.value}
//                 </div>
//                 <div className="mt-2 text-xs text-gray-500 font-medium">{m.sub}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* BUSINESS MODEL */}
//       <section className="py-24 bg-white border-t border-gray-100 mt-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-14">
//             <div className="inline-flex items-center gap-2 mb-4">
//               <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
//               <span className="text-[#05CE78] font-bold text-sm uppercase tracking-widest">Business Model</span>
//               <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
//             </div>
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               How Onya Diamonds Works
//             </h2>
//             <p className="text-gray-500 max-w-2xl mx-auto">
//               Investors co-own the working capital of the business. As the store sells, profits are distributed quarterly — proportional to your stake.
//             </p>
//           </div>

//           <div className="max-w-3xl mx-auto">
//             <div className="bg-[#0B1120] p-8 rounded-3xl shadow-xl border border-gray-800 text-white relative overflow-hidden">
//               <div className="absolute top-0 right-0 w-64 h-64 bg-[#05CE78] opacity-5 blur-[80px] rounded-full pointer-events-none" />
//               <h3 className="font-bold text-white mb-8 flex items-center gap-2">
//                 <BarChart3 className="w-5 h-5 text-[#05CE78]" /> Revenue Share Flow
//               </h3>
//               <div className="space-y-3 relative z-10">
//                 {[
//                   { label: "Customer Purchases Jewellery", sub: "In-store and online sales", value: "Revenue", color: "bg-white/5 border-white/10", textColor: "text-gray-300" },
//                   { label: "Gross Margin Retained", sub: "After cost of goods sold", value: "25–40%", color: "bg-[#05CE78]/10 border-[#05CE78]/20", textColor: "text-green-200" },
//                   { label: "Operating Costs Deducted", sub: "Rent, staff, marketing", value: "Fixed", color: "bg-white/5 border-white/10", textColor: "text-gray-300" },
//                   { label: "Net Profit Distributed", sub: "Quarterly to your bank account", value: "Your Share", color: "bg-[#05CE78]/20 border-[#05CE78]/50", textColor: "text-[#05CE78]" },
//                 ].map((row, i) => (
//                   <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${row.color}`}>
//                     <div>
//                       <span className={`text-sm font-bold ${row.textColor}`}>{row.label}</span>
//                       <span className="text-xs text-gray-500 block">{row.sub}</span>
//                     </div>
//                     <span className={`font-bold font-mono ${row.textColor}`}>{row.value}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* HIGHLIGHTS + DEAL TERMS */}
//       <section className="py-24 bg-gray-50 border-t border-gray-100">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid lg:grid-cols-3 gap-12">

//             {/* Highlights */}
//             <div className="lg:col-span-2 space-y-8">
//               <div>
//                 <div className="inline-flex items-center gap-2 mb-4">
//                   <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
//                   <span className="text-[#05CE78] font-bold text-sm uppercase tracking-widest">Why Invest</span>
//                 </div>
//                 <h2 className="text-3xl font-bold text-gray-900 mb-2">
//                   Premium Retail,{" "}
//                   <span className="text-[#05CE78]">Real Returns</span>
//                 </h2>
//                 <p className="text-gray-500 mb-8">
//                   Jewellery is India's second-largest consumer category. Onya Diamonds is positioned to capture the aspirational mid-premium buyer with a brand built for scale.
//                 </p>
//               </div>
//               <div className="grid sm:grid-cols-2 gap-4">
//                 {highlights.map((item, i) => (
//                   <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
//                     <div className="mt-1 text-[#05CE78] shrink-0">
//                       <item.icon className="w-6 h-6" />
//                     </div>
//                     <div>
//                       <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
//                       <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Deal Terms */}
//             <div className="lg:col-span-1">
//               <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sticky top-24">
//                 <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
//                   <Wallet className="w-5 h-5 text-[#05CE78]" /> Deal Terms
//                 </h3>
//                 <div className="space-y-5">
//                   {OPPORTUNITY.dealTerms.map((term, i) => (
//                     <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
//                       <span className="text-gray-500 text-sm font-medium">{term.label}</span>
//                       <span className="text-gray-900 font-bold text-sm text-right max-w-[140px]">{term.value}</span>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="mt-8 pt-6 border-t border-gray-100">
//                   <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
//                     <div className="flex items-start gap-3">
//                       <CheckCircle2 className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
//                       <div>
//                         <p className="text-sm font-bold text-amber-900 mb-1">Limited Co-Investor Slots</p>
//                         <p className="text-xs text-amber-700">
//                           We keep the investor group small to maintain governance quality and payout efficiency.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//           </div>
//         </div>
//       </section>

//       {/* TIMELINE */}
//       <ProjectTimeline data={timeline} title="Onya Diamonds Roadmap" />

//       {/* CTA */}
//       <section className="py-24 bg-[#0B1120] text-white text-center px-4 relative overflow-hidden border-t border-gray-800">
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
//         <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />
//         <div className="relative z-10 max-w-3xl mx-auto">
//           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 text-[#05CE78] rounded-full text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
//             <Gem className="w-3 h-3" /> Onya Diamonds
//           </div>
//           <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
//             Own a Piece of Onya Diamonds
//           </h2>
//           <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
//             Express interest now to receive the full information memorandum and secure your slot before the raise opens.
//           </p>
//           <div className="flex flex-col sm:flex-row justify-center gap-4">
//             <a
//               href="https://wa.me/919000272020"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="bg-[#05CE78] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#04b067] transition-all shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] flex items-center justify-center gap-2"
//             >
//               <MessageCircle className="w-5 h-5" /> Express Interest on WhatsApp
//             </a>
//             <Link
//               href="/opportunities/jewellery"
//               className="bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center gap-2"
//             >
//               <ChevronLeft className="w-4 h-4" />
//               View All Jewellery
//             </Link>
//           </div>
//         </div>
//       </section>

//     </div>
//   );
// }