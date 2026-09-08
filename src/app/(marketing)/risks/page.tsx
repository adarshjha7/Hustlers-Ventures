import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  Activity,
  Mail,
} from "lucide-react";

export default function RiskPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-[#05CE78] selection:text-white pb-20">
      
      {/* --- DARK HERO SECTION --- */}
      <div className="relative bg-[#0B1120] pt-32 pb-48 overflow-hidden">
        {/* Background Patterns */}
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
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 1. Top Navigation Row (Back Button) */}
          <div className="flex justify-start mb-12">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
              Back to Home
            </Link>
          </div>

          {/* 2. Centered Hero Content */}
          <div className="text-center">
            <div className="inline-flex justify-center mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-orange-500 shadow-2xl shadow-orange-900/20">
                <ShieldAlert className="w-10 h-10" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Risk Disclosure
            </h1>
            
            <p className="text-gray-400 text-lg mb-2">
              Please read carefully before investing with <span className="text-white font-semibold">Hustlers Ventures</span>.
            </p>
            <p className="text-gray-500 text-sm">
              Last updated: <span className="text-gray-300 font-semibold">May 2026</span>
            </p>
          </div>
        </div>
      </div>

      {/* --- OVERLAPPING CONTENT CARD --- */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12 space-y-12">
          
          {/* Main Warning Box */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl flex gap-5 items-start shadow-sm">
            <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-orange-900 text-lg mb-2">
                Capital is at Risk
              </h3>
              <p className="text-orange-800 leading-relaxed text-sm md:text-base">
                <strong>Hustlers Ventures</strong> does not guarantee returns. All investments carry inherent risks associated with real-world business operations. You should invest only what you can afford to lose.
              </p>
            </div>
          </div>

          {/* 1. Illiquidity */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">01</span>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Illiquidity Risk
              </h2>
            </div>
            <div className="pl-2 border-l-2 border-gray-100 ml-4">
              <div className="pl-6">
                <p className="text-gray-600 leading-relaxed">
                  Unlike public stocks which can be sold instantly, the assets on Hustlers Ventures (Buses, Restaurant Leases, Hostel Properties) are <strong>illiquid assets</strong>. You may not be able to exit your investment or sell your share before the defined tenure (typically 3-5 years) ends, unless a secondary buyer is found.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Operational Risk */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">02</span>
              <h2 className="text-xl font-bold text-gray-900">Operational Risk</h2>
            </div>
            <div className="pl-2 border-l-2 border-gray-100 ml-4">
              <div className="pl-6">
                <p className="text-gray-600 leading-relaxed mb-4">
                  Returns are generated strictly from the operational profits of the underlying assets. While our team executes with surgical precision, external factors can impact monthly payouts:
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    "Unexpected vehicle breakdowns or accidents.",
                    "Lower-than-expected occupancy (seasonality).",
                    "Fluctuations in raw material costs for F&B.",
                    "Staffing shortages or labor strikes."
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <Activity className="w-4 h-4 text-orange-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Market & Regulatory Risk */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">03</span>
              <h2 className="text-xl font-bold text-gray-900">Market & Regulatory Risk</h2>
            </div>
            <div className="pl-2 border-l-2 border-gray-100 ml-4">
              <div className="pl-6">
                <p className="text-gray-600 leading-relaxed">
                  Changes in government regulations (e.g., new transport taxes, changes in tourism policies) or macroeconomic factors (e.g., sharp rise in fuel prices) may affect the profitability of the portfolio assets beyond our control.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Loss of Capital */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">04</span>
              <h2 className="text-xl font-bold text-gray-900">Loss of Capital</h2>
            </div>
            <div className="pl-2 border-l-2 border-gray-100 ml-4">
              <div className="pl-6">
                <p className="text-gray-600 leading-relaxed">
                  While all assets are physically backed and insured, there is a risk that the recoverable value of the asset may be lower than the initial investment amount in case of a forced liquidation, natural disaster, or total loss scenario not fully covered by insurance.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Past Performance */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#05CE78] font-bold text-sm">05</span>
              <h2 className="text-xl font-bold text-gray-900">Past Performance</h2>
            </div>
            <div className="pl-2 border-l-2 border-gray-100 ml-4">
              <div className="pl-6">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4 items-start">
                   <TrendingDown className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                   <p className="text-gray-700 text-sm leading-relaxed">
                     Historical returns, ROI figures, and fleet growth numbers mentioned on the platform are based on past performance. <strong>Past performance is not indicative of future results.</strong> Projections are based on current market conditions and assumptions which may change.
                   </p>
                </div>
              </div>
            </div>
          </section>

          {/* Related Documents */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
            <span className="text-sm text-gray-400 font-medium self-center">Related:</span>
            <Link href="/privacy" className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600 hover:border-[#05CE78]/40 hover:text-[#05CE78] transition-colors font-medium">Privacy Policy</Link>
            <Link href="/terms" className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600 hover:border-[#05CE78]/40 hover:text-[#05CE78] transition-colors font-medium">Terms of Service</Link>
          </div>

          {/* Contact Footer */}
          <section className="pt-8 border-t border-gray-100">
            <p className="text-gray-600 mb-4">
              If you have specific concerns about a deal structure, please write to our legal team before investing.
            </p>
            <a 
              href="mailto:investments@hustlersventures.co" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-[#05CE78] transition-colors"
            >
              <Mail className="w-4 h-4" /> investments@hustlersventures.co
            </a>
          </section>

        </div>
      </div>
    </div>
  );
}