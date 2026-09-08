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
  TrendingUp,
  Bus,
  Utensils,
  Car,
  Info,
  Calculator,
  Building2
} from "lucide-react";

// --- DATA CONSTANTS (Total: 1.2 Cr) ---
const capexBreakdown = [
  { item: "Pre Engineered Structure (6000 Sft)", amount: 3500000 },
  { item: "Civil Work, Interiors & Furniture", amount: 3000000 },
  { item: "Kitchen Equipment & Crockery", amount: 2000000 },
  { item: "Security Deposit (Land Lease)", amount: 1500000 },
  { item: "Premium Washroom Complex", amount: 1000000 },
  { item: "Plumbing, Electricals & Generator", amount: 500000 },
  { item: "AC & Ventilation Setup", amount: 200000 },
  { item: "Landscaping & Branding", amount: 200000 },
  { item: "Office & Staff Setup", amount: 100000 },
];

const fixedOpexData = [
  { item: "Rent", amount: 120000 },
  { item: "Staff Cost", amount: 300000 },
  { item: "Electricity", amount: 70000 },
  { item: "Maintenance & Cleaning", amount: 50000 },
  { item: "Misc", amount: 50000 },
];

export default function JadcherlaBusinessModelPage() {
  // --- STATE ---
  const [investmentAmount, setInvestmentAmount] = useState(500000);
  const [busCount, setBusCount] = useState(20);
  const [paxPerBus, setPaxPerBus] = useState(15);
  const [avgTicketSize, setAvgTicketSize] = useState(200);
  const [dailyCarRevenue, setDailyCarRevenue] = useState(20000);
  const [showCapexModal, setShowCapexModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'revenue' | 'opex'>('revenue');

  // --- CALCULATIONS ---
  const totalCapex = 12000000;

  const dailyBusRevenueGross = busCount * paxPerBus * avgTicketSize;
  const totalDailyRevenueGross = dailyBusRevenueGross + dailyCarRevenue;
  const dailyDriverCost = busCount * 700;
  const netDailyRevenue = totalDailyRevenueGross - dailyDriverCost;
  const netMonthlyRevenue = netDailyRevenue * 30;
  const monthlyRawMaterialCost = Math.round(netMonthlyRevenue * 0.40);
  const totalFixedOpex = fixedOpexData.reduce((sum, item) => sum + item.amount, 0);
  const totalMonthlyOpex = totalFixedOpex + monthlyRawMaterialCost;
  const netMonthlyProfit = netMonthlyRevenue - totalMonthlyOpex;
  const totalInvestorPoolShare = Math.round(netMonthlyProfit * 0.50);

  // User Share Logic
  const userEquityPercentage = investmentAmount / totalCapex;
  const userMonthlyReturn = Math.round(totalInvestorPoolShare * userEquityPercentage);
  const userTotalReturns5Years = userMonthlyReturn * 60;
  const userAnnualReturn = userMonthlyReturn * 12;
  const userRoiPercentage = (userAnnualReturn / investmentAmount) * 100;

  return (
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900 selection:bg-[#05CE78] selection:text-white">
        <div className="pb-32">

          {/* --- DARK HERO BACKGROUND --- */}
          <div className="relative bg-[#0B1120] pt-24 pb-48 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto mb-8 relative z-10">
              <Link href="/opportunities/fnb/jadcherla-restaurant" className="inline-flex items-center text-gray-400 hover:text-white transition group">
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
                 Adjust bus traffic, ticket sizes, and investment levels to see your potential ROI.
               </p>
            </div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[120px] rounded-full pointer-events-none" />
          </div>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20 space-y-12">

            {/* --- CALCULATOR CARD --- */}
            <section className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 overflow-hidden">
              <div className="p-6 md:p-10">

                {/* 1. Investment Slider */}
                <div className="mb-12 p-8 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-end mb-6">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                        <Wallet className="w-4 h-4 text-[#05CE78]" /> Investment Amount
                      </label>
                      <div className="text-3xl font-extrabold text-gray-900 bg-white px-5 py-2 rounded-xl border border-gray-200 shadow-sm">
                        {formatCurrency(investmentAmount)}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={500000}
                      max={12000000}
                      step={500000}
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                      className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#05CE78]/50"
                    />
                    <div className="flex justify-between text-xs text-gray-400 font-medium mt-3">
                      <span>Min: ₹5L</span>
                      <span>Max: ₹1.2 Cr</span>
                    </div>
                </div>

                {/* 2. Operational Sliders (Grid) */}
                <h3 className="text-sm font-bold text-gray-900 mb-8 flex items-center gap-2 border-b border-gray-100 pb-4">
                  <TrendingUp className="w-4 h-4 text-[#05CE78]" /> Monthly Average Assumptions
                </h3>

                <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 mb-12">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Bus className="w-4 h-4" /> Daily Buses
                      </label>
                      <span className="font-bold text-lg text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{busCount}</span>
                    </div>
                    <input
                      type="range" min={10} max={50} step={1}
                      value={busCount}
                      onChange={(e) => setBusCount(Number(e.target.value))}
                      className="w-full accent-gray-900 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Users className="w-4 h-4" /> Pax per Bus
                      </label>
                      <span className="font-bold text-lg text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{paxPerBus}</span>
                    </div>
                    <input
                      type="range" min={10} max={40} step={1}
                      value={paxPerBus}
                      onChange={(e) => setPaxPerBus(Number(e.target.value))}
                      className="w-full accent-gray-900 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Utensils className="w-4 h-4" /> Bill Value / Head
                      </label>
                      <span className="font-bold text-lg text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">₹{avgTicketSize}</span>
                    </div>
                    <input
                      type="range" min={100} max={500} step={10}
                      value={avgTicketSize}
                      onChange={(e) => setAvgTicketSize(Number(e.target.value))}
                      className="w-full accent-gray-900 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Car className="w-4 h-4" /> Daily Pvt Revenue
                      </label>
                      <span className="font-bold text-lg text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{formatCurrency(dailyCarRevenue)}</span>
                    </div>
                    <input
                      type="range" min={5000} max={50000} step={1000}
                      value={dailyCarRevenue}
                      onChange={(e) => setDailyCarRevenue(Number(e.target.value))}
                      className="w-full accent-gray-900 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Data Visualization Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Asset Profit</div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(netMonthlyProfit)}</div>
                    <div className="text-xs text-gray-500">Monthly Net Income (100%)</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-bl-lg">50% SPLIT</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Investor Pool</div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalInvestorPoolShare)}</div>
                    <div className="text-xs text-gray-500">Distributable Amount</div>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#05CE78] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">YOU</div>
                    <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#05CE78] blur-2xl opacity-20" />
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Monthly Take</div>
                    <div className="text-3xl font-extrabold text-[#05CE78] mb-1">{formatCurrency(userMonthlyReturn)}</div>
                    <div className="text-xs text-gray-400">
                      ~{(userEquityPercentage * 100).toFixed(2)}% Ownership Share
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
                      Net Revenue Calculation
                    </button>
                    <button
                      onClick={() => setActiveTab('opex')}
                      className={`flex-1 py-5 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === 'opex' ? 'text-red-500 border-b-2 border-red-500 bg-red-50/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                      Monthly Expenses (OpEx)
                    </button>
                  </div>

                  <div className="p-8">
                    {activeTab === 'revenue' ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-end mb-4 pb-4 border-b border-gray-100">
                          <span className="text-gray-500 font-medium">Net Monthly Revenue</span>
                          <span className="text-3xl font-bold text-[#05CE78]">{formatCurrency(netMonthlyRevenue)}</span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">Total Gross Sales</p>
                                <p className="text-xs text-gray-500 mt-1">From Buses & Cars</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900 text-sm">{formatCurrency(totalDailyRevenueGross * 30)}</p>
                              </div>
                          </div>

                          <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                              <div>
                                <p className="font-bold text-red-900 text-sm">Less: Driver Incentives</p>
                                <p className="text-xs text-red-500 mt-1">₹700 per bus per halt</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-red-700 text-sm">-{formatCurrency(dailyDriverCost * 30)}</p>
                              </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            *Net Revenue is used as the base for calculating Food Cost (40%).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-between items-end mb-4 pb-4 border-b border-gray-100">
                          <span className="text-gray-500 font-medium">Total Operating Cost</span>
                          <span className="text-3xl font-bold text-red-500">{formatCurrency(totalMonthlyOpex)}</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="text-gray-700">Raw Materials (40%)</span>
                                <span className="text-gray-900">{formatCurrency(monthlyRawMaterialCost)}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-red-400 h-full rounded-full" style={{ width: '40%' }}></div>
                              </div>
                            </div>

                            {fixedOpexData.map((item, idx) => {
                              const percent = (item.amount / totalMonthlyOpex) * 100;
                              return (
                                <div key={idx} className="space-y-2">
                                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                    <span className="text-gray-600">{item.item}</span>
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

              {/* Right: CapEx Summary */}
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

                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center h-full">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 border border-blue-100">
                      <Building className="w-8 h-8" />
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total CapEx</p>
                    <p className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">{formatCurrency(totalCapex)}</p>

                    <div className="text-left bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100 mb-8">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Structure & Interiors</span>
                        <span className="font-bold text-gray-900">₹65.0L</span>
                      </div>
                      <div className="w-full h-px bg-gray-200/50" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Kitchen & Equip.</span>
                        <span className="font-bold text-gray-900">₹20.0L</span>
                      </div>
                      <div className="w-full h-px bg-gray-200/50" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Security Deposit</span>
                        <span className="font-bold text-gray-900">₹15.0L</span>
                      </div>
                      <div className="w-full h-px bg-gray-200/50" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Utilities & Setup</span>
                        <span className="font-bold text-gray-900">₹20.0L</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-left">
                        <h4 className="font-bold text-blue-900 text-xs uppercase mb-2 flex items-center gap-2">
                          <Info className="w-3 h-3" /> Investor Note
                        </h4>
                        <p className="text-blue-800 text-xs leading-relaxed">
                            By leveraging our own fleet of 10 buses daily, we de-risk the initial launch phase, guaranteeing ~₹30k/day revenue from Day 1.
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

          {/* --- CAPEX BREAKDOWN MODAL --- */}
          {showCapexModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
                <div className="bg-gray-50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-900">Capital Expenditure Breakdown</h3>
                  <button onClick={() => setShowCapexModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
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
