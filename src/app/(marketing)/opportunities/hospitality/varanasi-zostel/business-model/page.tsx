"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import {
  ChevronLeft,
  X,
  Wallet,
  Users,
  Building,
  Calculator,
  Building2,
  Info
} from "lucide-react";

// --- DATA CONSTANTS ---
const roomPricing = [
  { type: "4 Bed Dorm", rooms: 7, beds: 28, pricePerBed: 799 },
  { type: "6 Bed Dorm", rooms: 3, beds: 18, pricePerBed: 699 },
  { type: "Twin Sharing", rooms: 2, beds: 2, pricePerBed: 2299 },
  { type: "Deluxe Room", rooms: 6, beds: 6, pricePerBed: 2299 },
  { type: "Premium Room", rooms: 3, beds: 3, pricePerBed: 2999 },
];

const capexBreakdown = [
  { item: "Rent Advance", amount: 1000000 },
  { item: "Franchise Fee", amount: 1000000 },
  { item: "Design Fee", amount: 500000 },
  { item: "Interior Design", amount: 2500000 },
  { item: "Registration Lease Challan", amount: 500000 },
  { item: "Operational Expenses", amount: 500000 },
];

const opexBreakdown = [
  { group: "Salaries", amount: 157000 },
  { group: "Utilities", amount: 120000 },
  { group: "Maintenance & HSK", amount: 70000 },
  { group: "Rent", amount: 400000 },
  { group: "Zostel Comm. (Marketing)", amount: 432979 },
  { group: "Miscellaneous", amount: 20000 },
];

export default function BusinessModelPage() {
  // --- STATE ---
  const [occupancy, setOccupancy] = useState(85);
  const [investmentAmount, setInvestmentAmount] = useState(1000000);
  
  // UI Toggles
  const [showCapexModal, setShowCapexModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'revenue' | 'opex'>('revenue');

  // --- CALCULATIONS ---
  const totalCapex = capexBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const totalOpex = opexBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenuePerMonth = roomPricing.reduce((sum, r) => {
    const occupiedBeds = r.beds * (occupancy / 100);
    return sum + occupiedBeds * r.pricePerBed * 30; 
  }, 0);
  const profitPerMonth = totalRevenuePerMonth - totalOpex;
  const totalInvestorPoolShare = Math.round(profitPerMonth * 0.55); 
  const userEquityPercentage = investmentAmount / totalCapex;
  const userMonthlyReturn = Math.round(totalInvestorPoolShare * userEquityPercentage);
  const userAnnualReturn = userMonthlyReturn * 12;
  const userTotalReturns5Years = userMonthlyReturn * 60; 
  const userRoiPercentage = ((userAnnualReturn) / investmentAmount) * 100;

  return (
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900 selection:bg-[#05CE78] selection:text-white">
        <div className="pb-32">
        
        {/* --- DARK HERO BACKGROUND --- */}
        <div className="relative bg-[#0B1120] pt-24 pb-48 px-4 sm:px-6 lg:px-8">
          {/* Back Nav */}
          <div className="max-w-6xl mx-auto mb-8 relative z-10">
            <Link href="/opportunities/hospitality/varanasi-zostel" className="inline-flex items-center text-gray-400 hover:text-white transition group">
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Deal Overview</span>
            </Link>
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] text-xs font-bold tracking-widest uppercase mb-6">
                <Calculator className="w-3 h-3" /> Financial Simulator
             </div>
             <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
               Estimate Your <span className="text-[#05CE78]">Returns</span>
             </h1>
             <p className="text-gray-400 max-w-2xl mx-auto">
               Adjust the investment slider and occupancy rates to see how your portfolio performs under different market conditions.
             </p>
          </div>

          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[120px] rounded-full pointer-events-none" />
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20 space-y-12">
          
          {/* --- CALCULATOR CARD --- */}
          <section className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-10">
              
              {/* Sliders Grid */}
              <div className="grid md:grid-cols-2 gap-12 mb-12">
                {/* Investment Slider */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                      <Wallet className="w-4 h-4 text-[#05CE78]" /> Investment
                    </label>
                    <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">
                      {formatCurrency(investmentAmount)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={500000}
                    max={6000000}
                    step={500000}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#05CE78]/50"
                  />
                  <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>Min: ₹5L</span>
                    <span>Max: ₹60L</span>
                  </div>
                </div>

                {/* Occupancy Slider */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                      <Users className="w-4 h-4 text-[#05CE78]" /> Occupancy
                    </label>
                    <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">
                      {occupancy}%
                    </div>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    step={5}
                    value={occupancy}
                    onChange={(e) => setOccupancy(Number(e.target.value))}
                    className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#05CE78]/50"
                  />
                  <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>50% (Base)</span>
                    <span>100% (Peak)</span>
                  </div>
                </div>
              </div>

              {/* Data Visualization Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                
                {/* 1. Property Net Profit */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Asset Profit</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(profitPerMonth)}</div>
                  <div className="text-xs text-gray-500">Monthly Net Income (100%)</div>
                </div>

                {/* 2. Investor Pool */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-bl-lg">55% SPLIT</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Investor Pool</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalInvestorPoolShare)}</div>
                  <div className="text-xs text-gray-500">Distributable Amount</div>
                </div>

                {/* 3. YOUR SHARE */}
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#05CE78] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">YOU</div>
                  {/* Glow Effect */}
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#05CE78] blur-2xl opacity-20" />
                  
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Monthly Take</div>
                  <div className="text-3xl font-extrabold text-[#05CE78] mb-1">{formatCurrency(userMonthlyReturn)}</div>
                  <div className="text-xs text-gray-400">
                    ~{(userEquityPercentage * 100).toFixed(1)}% Ownership Share
                  </div>
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="border-t border-gray-100 pt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tenure</div>
                    <div className="text-xl font-bold text-gray-900">5 Years</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">5Y Total Returns</div>
                    <div className="text-xl font-bold text-[#05CE78]">{formatCurrency(userTotalReturns5Years)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Monthly Cashflow</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(userMonthlyReturn)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Annual ROI</div>
                    <div className="text-xl font-bold text-[#05CE78]">{userRoiPercentage.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* --- DEEP DIVE TABS --- */}
          <section className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* Left: Operational Breakdown */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-[#05CE78]" /> Asset Economics
              </h2>
              
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100">
                  <button 
                    onClick={() => setActiveTab('revenue')}
                    className={`flex-1 py-5 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === 'revenue' ? 'text-[#05CE78] border-b-2 border-[#05CE78] bg-green-50/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    Revenue Sources
                  </button>
                  <button 
                    onClick={() => setActiveTab('opex')}
                    className={`flex-1 py-5 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === 'opex' ? 'text-red-500 border-b-2 border-red-500 bg-red-50/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    Monthly Expenses
                  </button>
                </div>

                <div className="p-8">
                  {activeTab === 'revenue' ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end mb-4 pb-4 border-b border-gray-100">
                        <span className="text-gray-500 font-medium">Total Monthly Revenue</span>
                        <span className="text-3xl font-bold text-[#05CE78]">{formatCurrency(totalRevenuePerMonth)}</span>
                      </div>
                      <div className="space-y-4">
                        {roomPricing.map((room, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#05CE78]/30 transition-colors">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{room.type}</p>
                                <p className="text-xs text-gray-500 mt-1">{room.beds} Beds × {occupancy}% occ.</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900 text-sm">₹{room.pricePerBed}<span className="text-xs text-gray-400 font-normal">/night</span></p>
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end mb-4 pb-4 border-b border-gray-100">
                        <span className="text-gray-500 font-medium">Total Operating Cost</span>
                        <span className="text-3xl font-bold text-red-500">{formatCurrency(totalOpex)}</span>
                      </div>
                      
                      <div className="space-y-5">
                          {opexBreakdown.map((item, idx) => {
                            const percent = (item.amount / totalOpex) * 100;
                            return (
                              <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                  <span className="text-gray-600">{item.group}</span>
                                  <span className="text-gray-900">{formatCurrency(item.amount)}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-gray-800 h-full rounded-full opacity-60" 
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 sticky top-24">
               <div className="flex items-center justify-between mb-6 h-8">
                  <h2 className="text-xl font-bold text-gray-900">Project Cost</h2>
                  <button 
                    onClick={() => setShowCapexModal(true)}
                    className="text-xs font-bold text-[#05CE78] uppercase tracking-wide hover:underline"
                  >
                    Full Breakdown
                  </button>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-sm border border-blue-100">
                    <Building className="w-8 h-8" />
                  </div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total CapEx</p>
                  <p className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">{formatCurrency(totalCapex)}</p>
                  
                  <div className="text-left bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Interior & Design</span>
                      <span className="font-bold text-gray-900">₹30.0L</span>
                    </div>
                    <div className="w-full h-px bg-gray-200/50" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Franchise Fee</span>
                      <span className="font-bold text-gray-900">₹10.0L</span>
                    </div>
                    <div className="w-full h-px bg-gray-200/50" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Deposits & Ops</span>
                      <span className="font-bold text-gray-900">₹20.0L</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-left">
                    <h4 className="font-bold text-blue-900 text-xs uppercase mb-2 flex items-center gap-2">
                      <Info className="w-3 h-3" /> Investor Note
                    </h4>
                    <p className="text-blue-800 text-xs leading-relaxed">
                      55% of monthly net profit is distributed to investors. The remaining 45% covers operator fee and a reserve fund for property maintenance.
                    </p>
                  </div>
              </div>
            </div>
          </section>
        </main>

        {/* --- FLOATING CTA --- */}
        <div className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <a
            href="https://wa.me/919000272020"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto bg-[#05CE78] hover:bg-[#04b067] text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-green-900/30 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-sm"
          >
            <Wallet className="w-5 h-5" />
            Start Investment
          </a>
        </div>

        {/* CapEx Modal */}
        {showCapexModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
              <div className="bg-gray-50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-900">Capital Expenditure</h3>
                <button onClick={() => setShowCapexModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="p-8 space-y-4">
                {capexBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <span className="text-gray-600 font-medium">{item.item}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="pt-6 mt-2">
                   <div className="flex justify-between items-center bg-[#05CE78]/10 p-5 rounded-2xl border border-[#05CE78]/20">
                    <span className="font-bold text-[#05CE78] uppercase tracking-wide text-xs">Total Project Cost</span>
                    <span className="font-extrabold text-[#05CE78] text-xl">{formatCurrency(totalCapex)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
  );
}