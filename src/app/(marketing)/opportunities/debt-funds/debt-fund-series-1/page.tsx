import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, TrendingUp, Wallet, ShieldCheck, CheckCircle2,
  CalendarClock, Landmark, Banknote, ArrowDown, MessageCircle,
  BarChart3, Lock, PieChart,
} from "lucide-react";
import ProjectTimeline, { TimelineEvent } from "@/components/ProjectTimeline";
import DebtFundCalculator from "./_calculator";

export const revalidate = 3600;

const FUND = {
  title: "Debt Fund, Series 1",
  tagline:
    "A secured structured debt instrument offering fixed 12–16% p.a. returns, backed by operational business assets across Hustlers Ventures' portfolio.",
  heroMetrics: [
    { label: "Total Fund Size", value: "₹5 Crores", sub: "Fully Secured" },
    { label: "Fixed Returns p.a.", value: "12–16%", highlight: true, sub: "Paid Quarterly" },
    { label: "Min. Investment", value: "₹2 Lakhs", sub: "24-Month Tenure" },
  ],
  dealTerms: [
    { label: "Min Investment", value: "₹2,00,000" },
    { label: "Total Fund Size", value: "₹5 Crores" },
    { label: "Fixed Interest Rate", value: "12–16% p.a." },
    { label: "Tenure", value: "24 Months" },
    { label: "Payout Frequency", value: "Quarterly" },
    { label: "Security", value: "Asset-Backed (Charge on Assets)" },
    { label: "Fund Status", value: "Open for Subscription" },
  ],
};

const timeline: TimelineEvent[] = [
  {
    date: "July 2026",
    title: "Fund Opens for Subscription",
    desc: "Investor onboarding begins. Debenture agreements executed and funds received into escrow.",
    status: "upcoming",
  },
  {
    date: "August 2026",
    title: "Capital Deployment",
    desc: "Funds deployed as structured loans to operational Hustlers Ventures businesses (fleet, F&B, hospitality).",
    status: "upcoming",
  },
  {
    date: "October 2026",
    title: "First Quarterly Payout",
    desc: "Q1 interest (Aug-Sep) credited directly to investor bank accounts.",
    status: "upcoming",
  },
  {
    date: "Ongoing, Quarterly",
    title: "Regular Interest Payouts",
    desc: "Fixed interest accrued monthly, distributed every quarter throughout the 24-month tenure.",
    status: "upcoming",
  },
  {
    date: "August 2028",
    title: "Principal Repayment",
    desc: "Full principal returned to all investors at maturity along with final interest payout.",
    status: "upcoming",
  },
];

const highlights = [
  {
    icon: ShieldCheck,
    title: "Asset-Backed Security",
    desc: "Your capital carries a first-charge on operational business assets across the Hustlers Ventures portfolio: buses, equipment, and property.",
  },
  {
    icon: TrendingUp,
    title: "Fixed Returns, Zero Guesswork",
    desc: "Unlike equity, your return is contractually fixed at 12–16% p.a. regardless of business performance cycles.",
  },
  {
    icon: CalendarClock,
    title: "Quarterly Payouts",
    desc: "Interest accrues monthly and is credited to your bank account every quarter. No waiting for year-end distributions.",
  },
  {
    icon: Lock,
    title: "Senior Debt Position",
    desc: "As a debt holder, you rank above equity investors in the repayment waterfall. Your returns are paid before profits are distributed.",
  },
];

export default async function DebtFundSeries1Page({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string }>;
}) {
  const params = await searchParams;
  const fromDashboard = !!params.amount;

  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-[#05CE78] selection:text-white pb-32">

      {/* FLOATING CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center pointer-events-none pb-6 sm:pb-8">
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-2xl border border-gray-100 pointer-events-auto transition-transform hover:scale-105 active:scale-95">
          <a
            href="https://wa.me/919000272020"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#05CE78] text-white px-8 py-3.5 rounded-2xl font-bold text-lg shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] hover:bg-[#04b067] transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Secure a Slot on WhatsApp
          </a>
        </div>
      </div>

      {/* HERO */}
      <section className="relative bg-[#0B1120] pt-24 pb-48 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 80 80" fill="none">
            <path d="M0 0H80V80H0V0Z" fill="url(#grid-debt)" />
            <defs>
              <pattern id="grid-debt" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M1 0V40M0 1H40" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={fromDashboard ? "/dashboard" : "/opportunities/debt-funds"}
            className="inline-flex items-center text-gray-400 hover:text-white font-medium transition-colors mb-8 group text-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            {fromDashboard ? "Back to Dashboard" : "Back to Debt Funds"}
          </Link>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              <Landmark className="w-3 h-3" /> Debt Instrument · Fixed Income
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Debt Fund{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-400">
                Series 1
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
              {FUND.tagline}
            </p>
          </div>
        </div>

        {/* Hero image strip */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Image
            src="/opportunities/debt-funds/debt-fund-series-1.png"
            alt="Debt Fund Series 1"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* METRICS CARD */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {FUND.heroMetrics.map((m, i) => (
              <div
                key={i}
                className={`${
                  i === 0 ? "md:pr-4" : i === 2 ? "md:pl-4 text-center md:text-right" : "text-center md:px-4"
                } pt-6 md:pt-0 first:pt-0`}
              >
                <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">{m.label}</div>
                <div className={`text-4xl font-extrabold ${m.highlight ? "text-[#05CE78]" : "text-gray-900"}`}>
                  {m.value}
                </div>
                <div className="mt-2 text-xs text-gray-500 font-medium">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section className="py-24 bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
              <span className="text-[#05CE78] font-bold text-sm uppercase tracking-widest">How It Works</span>
              <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Structured Debt, Simplified
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              You lend capital to Hustlers Ventures operating businesses at a fixed rate. The businesses repay interest quarterly and return your principal at maturity.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-[#0B1120] p-8 rounded-3xl shadow-xl border border-gray-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#05CE78] opacity-5 blur-[80px] rounded-full pointer-events-none" />
              <h3 className="font-bold text-white mb-8 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#05CE78]" /> Cash Flow Waterfall
              </h3>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-sm font-bold text-gray-300">Your Capital Deployed</span>
                  <span className="text-[#05CE78] font-mono font-bold">₹2L to ₹5Cr</span>
                </div>
                <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                <div className="flex items-center justify-between p-4 bg-[#05CE78]/10 rounded-xl border border-[#05CE78]/20">
                  <div>
                    <span className="text-sm font-bold text-green-200">Fixed Interest Accrued</span>
                    <span className="text-xs text-[#05CE78] block">Accrues monthly</span>
                  </div>
                  <span className="text-white font-bold font-mono">12–16% p.a.</span>
                </div>
                <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                <div className="flex items-center justify-between p-4 bg-[#05CE78]/20 rounded-xl border border-[#05CE78]/50">
                  <div>
                    <span className="text-sm font-bold text-[#05CE78]">Quarterly Payout to You</span>
                    <span className="text-xs text-green-200 block">Direct bank transfer, every 3 months</span>
                  </div>
                  <div className="bg-[#05CE78] text-black text-xs font-bold px-3 py-1 rounded-full">
                    Fixed
                  </div>
                </div>
                <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-sm font-bold text-gray-300">Principal Returned at Maturity</span>
                  <span className="text-white font-bold font-mono">Month 24</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense>
        <DebtFundCalculator />
      </Suspense>

      {/* SECURITY STRUCTURE */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Security Structure</h2>
            <p className="text-gray-600 max-w-3xl">
              Your capital is protected through a first-charge on operational assets across Hustlers Ventures' portfolio, spanning the transportation fleet, F&B outlets, and hospitality assets.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                label: "Transportation Fleet",
                value: "8 Buses",
                sub: "₹8 Cr asset value · All India permit",
                color: "bg-blue-50 border-blue-100 text-blue-700",
              },
              {
                icon: PieChart,
                label: "F&B Outlets",
                value: "Highway Restaurants",
                sub: "Operational revenue-generating assets",
                color: "bg-orange-50 border-orange-100 text-orange-700",
              },
              {
                icon: Landmark,
                label: "Hospitality Properties",
                value: "Zostel Franchise",
                sub: "Brand-backed hospitality assets",
                color: "bg-emerald-50 border-emerald-100 text-emerald-700",
              },
            ].map((item, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${item.color} bg-white`}>
                <item.icon className="w-7 h-7 mb-4 opacity-70" />
                <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">{item.label}</div>
                <div className="text-xl font-bold text-gray-900 mb-1">{item.value}</div>
                <div className="text-xs text-gray-500">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <ProjectTimeline data={timeline} title="Fund Timeline" />

      {/* HIGHLIGHTS + DEAL TERMS */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Highlights */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
                  <span className="text-[#05CE78] font-bold text-sm uppercase tracking-widest">Why Invest</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Predictable Returns,{" "}
                  <span className="text-[#05CE78]">Real Security</span>
                </h2>
                <p className="text-gray-500 mb-8">
                  Debt Fund Series 1 is designed for investors who want consistent, contractual income without equity-level risk.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {highlights.map((item, i) => (
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

            {/* Deal Terms */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#05CE78]" /> Deal Terms
                </h3>
                <div className="space-y-5">
                  {FUND.dealTerms.map((term, i) => (
                    <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <span className="text-gray-500 text-sm font-medium">{term.label}</span>
                      <span className="text-gray-900 font-bold text-sm text-right max-w-[140px]">{term.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#05CE78] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-green-900 mb-1">Slots Are Limited</p>
                        <p className="text-xs text-green-700">
                          Total fund size is ₹5 Crores. Allocation is on a first-come, first-served basis.
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

      {/* CTA */}
      <section className="py-24 bg-[#0B1120] text-white text-center px-4 relative overflow-hidden border-t border-gray-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[150px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Deploy Capital in Debt Fund Series 1
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Lock in fixed 12–16% p.a. returns backed by real operational assets. Limited slots available.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://wa.me/919000272020"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#05CE78] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#04b067] transition-all shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" /> Secure a Slot on WhatsApp
            </a>
            <Link
              href={fromDashboard ? "/dashboard" : "/opportunities/debt-funds"}
              className="bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {fromDashboard ? "Back to Dashboard" : "View All Debt Funds"}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
