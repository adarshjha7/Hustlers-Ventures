"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import {
  ChevronLeft,
  Wallet,
  TrendingUp,
  Calculator,
  Bus,
  Utensils,
  BedDouble,
  Banknote,
  CalendarClock,
  Info,
  RefreshCcw,
  Coins,
  Percent,
  PieChart
} from "lucide-react";

// --- ASSET CONFIGURATION ---
const ASSET_MIX = [
  {
    id: "transport",
    name: "Intercity Fleet",
    icon: Bus,
    allocation: 0.40, // 40%
    baseYield: 24, // 24% Annual ROI
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100"
  },
  {
    id: "fnb",
    name: "Highway F&B",
    icon: Utensils,
    allocation: 0.30, // 30%
    baseYield: 30, // 30% Annual ROI
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100"
  },
  {
    id: "hospitality",
    name: "Zostel Hostel",
    icon: BedDouble,
    allocation: 0.30, // 30%
    baseYield: 28, // 28% Annual ROI
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100"
  }
];

export default function AlphaBusinessModelPage() {
  // --- STATE ---
  const [investmentAmount, setInvestmentAmount] = useState(5000000);
  const [marketCondition, setMarketCondition] = useState(1.0);

  // --- FINANCIAL ENGINE ---

  // 1. Allocation
  const capitalTransport = investmentAmount * 0.40;
  const capitalFnB = investmentAmount * 0.30;
  const capitalHostel = investmentAmount * 0.30;

  // 2. Returns (Annual Operational Yield)
  const yieldTransport = ASSET_MIX[0].baseYield * marketCondition;
  const yieldFnB = ASSET_MIX[1].baseYield * marketCondition;
  const yieldHostel = ASSET_MIX[2].baseYield * marketCondition;

  const returnTransport = capitalTransport * (yieldTransport / 100);
  const returnFnB = capitalFnB * (yieldFnB / 100);
  const returnHostel = capitalHostel * (yieldHostel / 100);

  // 3. Operational Totals
  const totalAnnualReturn = returnTransport + returnFnB + returnHostel;
  const totalMonthlyReturn = totalAnnualReturn / 12;
  const totalQuarterlyPayout = totalMonthlyReturn * 3;
  const total5YearOperational = totalAnnualReturn * 5;

  // --- 4. EXIT STRATEGY (Year 5) ---
  const transportExitValue = capitalTransport * 1.50; // Principal + 50% Profit
  const fnbExitValue = capitalFnB; // Principal Only
  const hostelExitValue = capitalHostel; // Principal Only

  const totalExitPayout = transportExitValue + fnbExitValue + hostelExitValue;

  // 5. Grand Totals
  const totalLifetimeReturn = total5YearOperational + totalExitPayout;
  const blendedROI = (totalAnnualReturn / investmentAmount) * 100;
  const totalMultiplier = totalLifetimeReturn / investmentAmount;

  return (
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900 relative selection:bg-[#05CE78] selection:text-white">

        {/* --- HEADER --- */}
        <div className="relative bg-[#0B1120] pt-24 pb-48 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto mb-8 relative z-10">
            <Link href="/opportunities/hustlers-portfolio/hustlers-alpha" className="inline-flex items-center text-gray-400 hover:text-white font-medium transition-colors group">
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Alpha Fund
            </Link>
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] text-xs font-bold tracking-widest uppercase mb-6">
                <Calculator className="w-3 h-3" /> Portfolio Simulator
             </div>
             <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
               Project Your <span className="text-[#05CE78]">Blended Returns</span>
             </h1>
             <p className="text-gray-400 max-w-2xl mx-auto">
               Calculates weighted returns across Fleet, F&B, and Hospitality assets.
             </p>
          </div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[120px] rounded-full pointer-events-none" />
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20 space-y-12 pb-32">

          {/* --- MAIN CALCULATOR CARD --- */}
          <section className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-10">

              {/* Input Sliders */}
              <div className="grid md:grid-cols-2 gap-12 mb-12">

                 {/* Investment Slider */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                        <Wallet className="w-4 h-4 text-[#05CE78]" /> Fund Allocation
                      </label>
                      <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">
                        {formatCurrency(investmentAmount)}
                      </div>
                    </div>
                    <input type="range" min={2000000} max={20000000} step={500000} value={investmentAmount} onChange={(e) => setInvestmentAmount(Number(e.target.value))} className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-xs text-gray-400 font-medium"><span>Min: ₹20L</span><span>Max: ₹2 Cr</span></div>
                 </div>

                 {/* Market Scenario Slider */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4 text-[#05CE78]" /> Market Scenario
                      </label>
                      <div className={`text-lg font-bold px-4 py-1 rounded-lg border ${marketCondition < 1 ? 'bg-red-50 text-red-600 border-red-100' : marketCondition > 1 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-900 border-gray-100'}`}>
                        {marketCondition < 1 ? "Conservative" : marketCondition > 1 ? "Aggressive" : "Base Case"}
                      </div>
                    </div>
                    <input type="range" min={0.8} max={1.2} step={0.1} value={marketCondition} onChange={(e) => setMarketCondition(Math.round(Number(e.target.value) * 10) / 10)} className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-xs text-gray-400 font-medium"><span>Bear Market (-20%)</span><span>Bull Market (+20%)</span></div>
                 </div>
              </div>

              {/* Consolidated Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                     <Banknote className="w-3 h-3" /> Monthly Accrual
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatCurrency(totalMonthlyReturn)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Income generated per month
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#05CE78] text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg">PAYOUT</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quarterly Dividend</div>
                  <div className="text-2xl font-bold text-[#05CE78] mb-1">
                    {formatCurrency(totalQuarterlyPayout)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Disbursed directly to bank
                  </div>
                </div>

                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-white text-gray-900 text-[9px] font-bold px-3 py-1 rounded-bl-lg">WEIGHTED</div>
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#05CE78] blur-2xl opacity-20" />
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Portfolio Yield</div>
                  <div className="text-3xl font-extrabold text-[#05CE78] mb-1">
                    {blendedROI.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Annualized Weighted Return
                  </div>
                </div>
              </div>

              {/* --- 1 YEAR vs 5 YEAR TOTALS --- */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-8 mb-10">
                <h3 className="text-lg font-bold text-indigo-900 mb-6 flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-indigo-600" /> Projected Payouts
                </h3>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* 1 Year */}
                  <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-indigo-50">
                     <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">1-Year Total Return</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAnnualReturn)}</p>
                     </div>
                     <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                        <span className="text-xs font-bold">1Y</span>
                     </div>
                  </div>

                  {/* 5 Year */}
                  <div className="flex flex-col bg-[#0B1120] p-6 rounded-2xl shadow-lg border border-gray-800 relative overflow-hidden">
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">5-Year Lifetime Return</p>
                          <div className="bg-[#05CE78] text-[10px] font-bold text-black px-2 py-0.5 rounded-md">
                             {totalMultiplier.toFixed(2)}x
                          </div>
                        </div>
                        <p className="text-4xl font-extrabold text-[#05CE78] mb-2">{formatCurrency(totalLifetimeReturn)}</p>
                        <div className="text-[10px] text-gray-500 font-medium flex gap-2">
                           <span>Cashflow: {formatCurrency(total5YearOperational)}</span>
                           <span>•</span>
                           <span className="text-gray-400">Exit Value: {formatCurrency(totalExitPayout)}</span>
                        </div>
                     </div>
                     <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#05CE78]/10 to-transparent" />
                  </div>
                </div>

                {/* EXIT STRATEGY NOTES */}
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                   <div className="bg-white/60 p-3 rounded-xl border border-indigo-100 text-[10px] text-indigo-800 flex gap-2">
                      <Coins className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                      <p>
                        <strong>Bus Exit (40%):</strong> Fleet Sale. Investors receive Principal + 50% Asset Appreciation.
                      </p>
                   </div>
                   <div className="bg-white/60 p-3 rounded-xl border border-indigo-100 text-[10px] text-indigo-800 flex gap-2">
                      <RefreshCcw className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                      <p>
                        <strong>F&B/Hostel Exit (60%):</strong> Rental Deposit Refund. Investors receive 100% of Principal (Deposit) back.
                      </p>
                   </div>
                </div>
              </div>

            </div>
          </section>

          {/* --- ASSET BREAKDOWN (WITH PERCENTAGE YIELD) --- */}
          <section>
             <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
               <PieChart className="w-6 h-6 text-[#05CE78]" /> Earnings by Asset Class
             </h2>

             <div className="grid lg:grid-cols-3 gap-6">

                {/* ASSET 1: TRANSPORT */}
                <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden flex flex-col">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                         <Bus className="w-6 h-6" />
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">40%</span>
                   </div>
                   <h3 className="font-bold text-gray-900 text-lg mb-1">Intercity Fleet</h3>
                   <p className="text-xs text-gray-500 mb-6">Capital: <span className="font-bold text-gray-900">{formatCurrency(capitalTransport)}</span></p>

                   <div className="mt-auto space-y-3 pt-6 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-medium">Target Yield</span>
                         <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                            <Percent className="w-3 h-3" /> {yieldTransport.toFixed(1)}%
                         </span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-medium">Monthly Earning</span>
                         <span className="text-sm font-bold text-gray-900">{formatCurrency(returnTransport / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-medium">Annual Return</span>
                         <span className="text-sm font-bold text-gray-900">{formatCurrency(returnTransport)}</span>
                      </div>
                   </div>
                </div>

                {/* ASSET 2: F&B */}
                <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden flex flex-col">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                         <Utensils className="w-6 h-6" />
                      </div>
                      <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md">30%</span>
                   </div>
                   <h3 className="font-bold text-gray-900 text-lg mb-1">Highway F&B</h3>
                   <p className="text-xs text-gray-500 mb-6">Capital: <span className="font-bold text-gray-900">{formatCurrency(capitalFnB)}</span></p>

                   <div className="mt-auto space-y-3 pt-6 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-medium">Target Yield</span>
                         <span className="text-sm font-bold text-orange-600 flex items-center gap-1">
                            <Percent className="w-3 h-3" /> {yieldFnB.toFixed(1)}%
                         </span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-medium">Monthly Earning</span>
                         <span className="text-sm font-bold text-gray-900">{formatCurrency(returnFnB / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-medium">Annual Return</span>
                         <span className="text-sm font-bold text-gray-900">{formatCurrency(returnFnB)}</span>
                      </div>
                   </div>
                </div>

                {/* ASSET 3: HOSPITALITY */}
                <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm relative overflow-hidden flex flex-col">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                         <BedDouble className="w-6 h-6" />
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">30%</span>
                   </div>
                   <h3 className="font-bold text-gray-900 text-lg mb-1">Hospitality</h3>
                   <p className="text-xs text-gray-500 mb-6">Capital: <span className="font-bold text-gray-900">{formatCurrency(capitalHostel)}</span></p>

                   <div className="mt-auto space-y-3 pt-6 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-medium">Target Yield</span>
                         <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                            <Percent className="w-3 h-3" /> {yieldHostel.toFixed(1)}%
                         </span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-medium">Monthly Earning</span>
                         <span className="text-sm font-bold text-gray-900">{formatCurrency(returnHostel / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-medium">Annual Return</span>
                         <span className="text-sm font-bold text-gray-900">{formatCurrency(returnHostel)}</span>
                      </div>
                   </div>
                </div>

             </div>
          </section>

        </main>

        {/* --- FLOATING CTA --- */}
        <div className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <a href="https://wa.me/919000272020" target="_blank" rel="noopener noreferrer" className="pointer-events-auto bg-[#05CE78] hover:bg-[#04b067] text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-green-900/30 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-sm">
            <Wallet className="w-5 h-5" /> Start Portfolio Investment
          </a>
        </div>

      </div>
  );
}
