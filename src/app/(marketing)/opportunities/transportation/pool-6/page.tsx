import Link from "next/link";
import React from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 3600;
import { 
  ChevronLeft, 
  TrendingUp, 
  Wallet, 
  Bus, 
  BarChart3, 
  CheckCircle2, 
  ShieldCheck,
  PieChart,
  CalendarClock,
  Landmark,
  Banknote,
  ArrowDown,
  Users
} from "lucide-react";

// Import Timeline Component
import ProjectTimeline, { TimelineEvent } from "@/components/ProjectTimeline";

// --- Configuration Data ---
const POOL_DATA = {
  id: "pool-6",
  title: "Pool-6 Investment Opportunity",
  category: "Transportation Fleet",
  // UPDATED DESCRIPTION HERE
  description: "We are deploying a fleet of 8 premium intercity sleepers (Ashok Leyland 13.5M) by partnering with top-tier operators (IntrCity, ZingBus, FlixBus). This pool leverages a 75:25 Debt-to-Equity structure to amplify investor returns.",
  
  // Hero Stats
  heroMetrics: [
    { label: "Total Asset Value", value: "₹8.0 Cr" },
    { label: "Target Annual ROI", value: "18% - 24%", highlight: true },
    { label: "Min. Investment", value: "₹5 Lakhs" },
  ],

  // Deal Terms
  dealTerms: [
    { label: "Min Investment", value: "₹5,00,000" },
    { label: "Pool Size (Equity)", value: "₹2.0 Crores" }, 
    { label: "Bank Loan Cover", value: "₹6.0 Crores" },    
    { label: "Monthly EMI", value: "~₹9.2 Lakhs" },        
    { label: "Fund Status", value: "Open for Subscription" },
  ]
};

// --- TIMELINE DATA ---
const poolTimeline: TimelineEvent[] = [
  {
    date: "October 2025",
    title: "Fleet Procurement Order",
    desc: "Purchase order placed for 8 Ashok Leyland 13.5M Chassis. Bank loan sanction secured.",
    status: "completed"
  },
  {
    date: "November 2025",
    title: "Body Building & Branding",
    desc: "Chassis delivered to MG Body Builders. Custom sleeper configuration and Twilight branding in progress.",
    status: "completed"
  },
  {
    date: "January 2026",
    title: "RTO Registration & Permits",
    desc: "All India Tourist Permit (AITP) issuance and insurance formalities for 8 vehicles.",
    status: "completed"
  },
  {
    date: "February 2026",
    title: "Commercial Launch",
    desc: "Fleet deployed on Hyd-Bangalore and Hyd-Mumbai routes via IntrCity/ZingBus platforms.",
    status: "completed"
  },
  {
    date: "July 2026",
    title: "First Quarterly Payout",
    desc: "First profit distribution (Apr-May-Jun) credited to investor bank accounts.",
    status: "upcoming"
  }
];

export default async function Pool6Page() {
  let filledPct: number | null = null;
  const { data: opp } = await supabaseAdmin
    .from("opportunities")
    .select("pool_id, total_pool_size, filled_pct, company_pools ( total_cost )")
    .eq("slug", "pool-6")
    .single();
  if (opp) {
    if (opp.filled_pct != null) {
      filledPct = Number(opp.filled_pct);
    } else if (opp.pool_id) {
      const { data: invData } = await supabaseAdmin
        .from("investor_investments")
        .select("total_amount")
        .eq("purchase_id", opp.pool_id);
      const invested = (invData ?? []).reduce((s: number, r: any) => s + Number(r.total_amount), 0);
      const totalCost = opp.total_pool_size ?? (opp.company_pools as any)?.total_cost;
      if (invested > 0 && totalCost) filledPct = Math.min(100, (invested / Number(totalCost)) * 100);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-[#05CE78] selection:text-white pb-32">
      
      {/* --- FLOATING CTA --- */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center pointer-events-none pb-6 sm:pb-8">
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-2xl border border-gray-100 pointer-events-auto transition-transform hover:scale-105 active:scale-95">
          <Link
            href={`/opportunities/transportation/${POOL_DATA.id}/business-model`}
            className="flex items-center gap-3 bg-[#05CE78] text-white px-8 py-3.5 rounded-2xl font-bold text-lg shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] hover:bg-[#04b067] transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            View Financial Breakdown
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
            href="/opportunities/transportation" 
            className="inline-flex items-center text-gray-400 hover:text-white font-medium transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> 
            Back to Transportation Portfolio
          </Link>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              <Bus className="w-3 h-3" /> {POOL_DATA.category}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Pool-6 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-400">
                Leveraged Fleet Fund
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
              {POOL_DATA.description}
            </p>
          </div>
        </div>
      </section>

      {/* --- METRICS CARD --- */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            
            {/* Asset Value */}
            <div className="text-center md:text-left md:pr-4">
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">{POOL_DATA.heroMetrics[0].label}</div>
              <div className="text-4xl font-extrabold text-gray-900">{POOL_DATA.heroMetrics[0].value}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-[#05CE78] rounded-lg text-xs font-bold">
                 <CheckCircle2 className="w-3 h-3" /> 8 Buses (Asset Scale)
              </div>
            </div>

            {/* ROI */}
            <div className="text-center md:px-4 pt-6 md:pt-0">
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">{POOL_DATA.heroMetrics[1].label}</div>
              <div className="text-4xl font-extrabold text-[#05CE78]">{POOL_DATA.heroMetrics[1].value}</div>
              <div className="mt-2 text-xs text-gray-500 font-medium">
                Post-Debt Service Yield
              </div>
            </div>

            {/* Frequency */}
            <div className="text-center md:text-right md:pl-4 pt-6 md:pt-0">
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">{POOL_DATA.heroMetrics[2].label}</div>
              <div className="text-4xl font-extrabold text-gray-900">{POOL_DATA.heroMetrics[2].value}</div>
              <div className="mt-2 text-xs text-gray-500 font-medium">
                ~2.5% Profit Share per slot
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
              <div className={`h-full rounded-full transition-all duration-1000 ${filledPct >= 100 ? "bg-gray-400" : "bg-[#05CE78]"}`}
                style={{ width: `${Math.min(100, filledPct)}%` }} />
            </div>
            {filledPct >= 100 && <p className="text-xs text-gray-400 mt-2 font-medium">This pool is fully funded.</p>}
          </div>
        </section>
      )}

      {/* --- PARTNER LOGOS --- */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Ticketing & Fleet Partners</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { name: "IntrCity SmartBus", tag: "Ticketing Platform", logo: "/brands/intrcity.png" },
              { name: "ZingBus", tag: "Ticketing Platform", logo: "/brands/zingbus.png" },
              { name: "FlixBus India", tag: "Ticketing Platform", logo: "/brands/flixbus.png" },
              { name: "Ashok Leyland", tag: "Fleet OEM", logo: "/brands/ashokleyland.png" },
              { name: "Bharat Benz", tag: "Fleet OEM", logo: "/brands/bharatbenz.png" },
            ].map(({ name, tag, logo }) => (
              <div key={name} className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl border border-gray-200 bg-gray-50 min-w-[120px]">
                {logo ? (
                  <img src={logo} alt={name} className="h-10 w-auto max-w-[100px] object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[#05CE78]/10 border border-[#05CE78]/20 flex items-center justify-center">
                    <span className="text-[#05CE78] font-extrabold text-sm">{name[0]}</span>
                  </div>
                )}
                <span className="text-xs font-bold text-gray-700 text-center">{name}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#05CE78]">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CAPITAL STRUCTURE --- */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="mb-12">
               <h2 className="text-3xl font-bold text-gray-900 mb-4">Capital Structure (8 Buses)</h2>
               <p className="text-gray-600 max-w-3xl">
                 This pool finances a fleet of 8 buses worth ₹8 Crores. By securing 75% bank leverage, we only require ₹2 Cr of investor equity, significantly enhancing the return on your invested capital.
               </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
               
               {/* FUNDING MIX */}
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-8 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#05CE78]" /> Funding Mix (₹8.0 Cr)
                  </h3>

                  <div className="w-full h-16 flex rounded-2xl overflow-hidden mb-8 shadow-inner">
                     <div className="w-[25%] bg-[#05CE78] flex items-center justify-center text-white font-bold text-sm relative group cursor-help">
                        25%
                        <div className="absolute -top-10 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                           Investor Equity (₹2.0 Cr)
                        </div>
                     </div>
                     <div className="w-[75%] bg-gray-800 flex items-center justify-center text-white font-bold text-sm relative group cursor-help">
                        75%
                        <div className="absolute -top-10 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                           Bank Debt (₹6.0 Cr)
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1 flex items-center gap-2">
                           <Users className="w-3 h-3" /> Investor Pool
                        </div>
                        <div className="text-2xl font-bold text-gray-900">₹2.0 Crores</div>
                        <div className="text-xs text-gray-500 mt-1">Equity Raised</div>
                     </div>
                     <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-2">
                           <Landmark className="w-3 h-3" /> Bank Loan
                        </div>
                        <div className="text-2xl font-bold text-gray-900">₹6.0 Crores</div>
                        <div className="text-xs text-gray-500 mt-1">Secured Debt</div>
                     </div>
                  </div>
               </div>

               {/* CASH FLOW WATERFALL */}
               <div className="bg-[#0B1120] p-8 rounded-3xl shadow-xl border border-gray-800 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#05CE78] opacity-5 blur-[80px] rounded-full pointer-events-none" />
                  
                  <h3 className="font-bold text-white mb-8 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-[#05CE78]" /> Cash Flow Engine
                  </h3>

                  <div className="space-y-4 relative z-10">
                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-sm font-bold text-gray-300">Revenue (8 Buses)</span>
                        <span className="text-green-400 font-mono">+++ Gross Income</span>
                     </div>
                     <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                     <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-red-200">Consolidated EMI</span>
                           <span className="text-xs text-red-400">Principal + Interest</span>
                        </div>
                        <span className="text-white font-bold font-mono">- ₹9.2 Lakhs/mo</span>
                     </div>
                     <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                     <div className="flex items-center justify-between p-4 bg-[#05CE78]/20 rounded-xl border border-[#05CE78]/50 shadow-[0_0_20px_rgba(5,206,120,0.1)]">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-[#05CE78]">Quarterly Payout</span>
                           <span className="text-xs text-green-200">Accrues Monthly, Paid Qtrly</span>
                        </div>
                        <div className="bg-[#05CE78] text-black text-xs font-bold px-3 py-1 rounded-full">
                           18-24% Yield
                        </div>
                     </div>
                  </div>
               </div>

            </div>
        </div>
      </section>

      {/* --- TIMELINE --- */}
      <ProjectTimeline data={poolTimeline} title="Deployment Schedule" />

      {/* --- DEAL DETAILS --- */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Thesis (Updated with Partnership) */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 mb-4">
                   <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
                   <span className="text-[#05CE78] font-bold text-sm uppercase tracking-widest">Investment Thesis</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Predictable Returns through <br/>
                  <span className="text-[#05CE78]">Operational Excellence</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  By scaling to a fleet of 8 buses, we optimize maintenance costs and negotiate better terms <strong>by partnering with top-tier operators (IntrCity, ZingBus, FlixBus)</strong>. This ensures consistent occupancy and protects investor returns against individual vehicle downtime.
                </p>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: ShieldCheck, title: "Asset Backed", desc: "Your capital is secured against 8 physical buses (₹8Cr Value)." },
                  { icon: TrendingUp, title: "High Demand Routes", desc: "Operating on Hyd-Bangalore & Hyd-Mumbai corridors." },
                  { icon: PieChart, title: "Leveraged Returns", desc: "Bank debt amplifies equity returns to 18-24%." },
                  { icon: CalendarClock, title: "Quarterly Payouts", desc: "Profits accrued monthly, distributed every quarter." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
                  Deal Terms
                </h3>
                <div className="space-y-6">
                  {POOL_DATA.dealTerms.map((term, index) => (
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
                        <p className="text-sm font-bold text-green-900 mb-1">Fund is Active</p>
                        <p className="text-xs text-green-700">
                          Equity slots for the 8-bus fleet are limited. Allocation is First-Come-First-Serve.
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

      {/* HUSTLERS VENTURES ASSURANCE */}
      <div className="bg-[#05CE78]/5 border-y border-[#05CE78]/15 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start sm:items-center gap-4">
          <ShieldCheck className="w-7 h-7 text-[#05CE78] shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <p className="font-bold text-gray-900 text-sm">Hustlers Ventures Assurance</p>
            <p className="text-sm text-gray-500 mt-0.5">We take accountability for delays. Your returns are calculated from day one of your investment, not day one of operations.</p>
          </div>
        </div>
      </div>

      {/* --- CTA --- */}
      <section className="py-24 bg-[#0B1120] text-white text-center px-4 relative overflow-hidden border-t border-gray-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[150px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Deploy Capital in Pool-6
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Join the smart fleet revolution. Secure your slot in this high-yield, asset-backed transportation fund.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="https://wa.me/919000272020" target="_blank" rel="noopener noreferrer" className="bg-[#05CE78] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#04b067] transition-all shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] flex items-center justify-center gap-2">
              Secure a Slot on WhatsApp
            </a>
            <Link href={`/opportunities/transportation/${POOL_DATA.id}/business-model`} className="bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" /> ROI Simulator
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}