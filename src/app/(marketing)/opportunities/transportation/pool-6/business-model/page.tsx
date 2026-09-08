/*
 * OLD PAGE COMMENTED OUT — replaced by new simulator below
 * (original code preserved above this block for reference)
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  BarChart3,
  TrendingUp,
  Bus,
  MessageCircle,
  X,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

function fmt(lakhs: number) {
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(2)} Cr`;
  return `₹${lakhs.toFixed(1)}L`;
}

function fmtRs(rs: number) {
  return `₹${Math.round(rs).toLocaleString("en-IN")}`;
}

// ── Model constants ────────────────────────────────────────────────────────────
const BUSES = 2;
const SEATS = 34;
const TRIPS_PER_MONTH = 28;
const EMI = 285000;              // ₹2.85L/month
const B_GST = 50000;             // ₹50k GST input credit (fixed monthly)
const C_MG_SAVINGS = 56000;      // TODO: replace with actual MG savings value once confirmed
const MG_PER_TRIP = 20000;       // TODO: replace with actual MG breakdown once confirmed
const TOTAL_EQUITY_RS = 20000000; // ₹2 Cr equity pool — TODO: confirm with user
const TOTAL_ASSET_RS = 80000000; // ₹8 Cr total asset value

const L = (rs: number) => rs / 100000; // rupees → lakhs

function calcModel(investmentL: number, ticketPrice: number, occupancyPct: number) {
  // Revenue per trip = ticketPrice × seats × 2 buses × occupancy
  const revenuePerTrip = ticketPrice * SEATS * BUSES * (occupancyPct / 100);

  // Profit per trip = (Revenue − MG) × 50% investor share
  const profitPerTrip = Math.max(0, (revenuePerTrip - MG_PER_TRIP) * 0.50);

  // A = profit × 28 trips/month
  const A = profitPerTrip * TRIPS_PER_MONTH;

  // B = GST input credit (fixed monthly)
  const B = B_GST;

  // C = MG savings (fixed)
  const C = C_MG_SAVINGS;

  // I1 = (A + B − EMI) × 75%
  const I1 = Math.max(0, (A + B - EMI) * 0.75);

  // I2 = C × 40%
  const I2 = C * 0.40;

  // Total investor pool payout per month
  const totalPoolPayout = I1 + I2;

  // Individual investor share (proportional to equity)
  const investorShare = investmentL / L(TOTAL_EQUITY_RS);
  const monthlyPayoutL = L(totalPoolPayout) * investorShare;
  const totalPayouts60L = monthlyPayoutL * 60;

  // Exit: fleet sold at 30% of asset value, bank loan fully paid off by EMIs
  const resaleL = L(TOTAL_ASSET_RS) * 0.30;
  const capitalGainL = resaleL - L(TOTAL_EQUITY_RS);
  const investorGainL = Math.max(0, capitalGainL * 0.40);
  const exitPoolL = L(TOTAL_EQUITY_RS) + investorGainL;
  const exitValueL = exitPoolL * investorShare;

  const totalValueL = totalPayouts60L + exitValueL;
  const annualReturnPct = (monthlyPayoutL * 12 / investmentL) * 100;

  return {
    // Per-trip breakdown
    revenuePerTrip, mgPerTrip: MG_PER_TRIP, profitPerTrip,
    // Monthly pool
    A: L(A), B: L(B), C: L(C), I1: L(I1), I2: L(I2),
    totalPoolPayoutL: L(totalPoolPayout),
    // Individual investor
    investorShare,
    monthlyPayoutL,
    totalPayouts60L,
    // Exit
    resaleL, capitalGainL, investorGainL, exitPoolL, exitValueL,
    // Totals
    totalValueL, annualReturnPct,
  };
}

function sliderStyle(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #05CE78 0%, #05CE78 ${pct}%, #b6b6b6 ${pct}%, #808080 100%)`,
  };
}

// ── Mobile sticky bar ──────────────────────────────────────────────────────────
function MobileSticky({
  m,
  investmentL,
  ticketPrice,
  occupancyPct,
  waLink,
}: {
  m: ReturnType<typeof calcModel>;
  investmentL: number;
  ticketPrice: number;
  occupancyPct: number;
  waLink: string;
}) {
  const [showReturnPanel, setShowReturnPanel] = useState(false);
  const [showLocalExitPanel, setShowLocalExitPanel] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (showReturnPanel || showLocalExitPanel) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showReturnPanel, showLocalExitPanel]);

  return (
    <>
      <div className="bg-white border-t border-gray-100 px-3 pt-2 pb-3">
        <div className="bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.10)] flex items-stretch gap-2 px-3 py-3">
          {/* Monthly Payout */}
          <div className="relative bg-[#0B1120] rounded-xl px-3 py-2.5 flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">Monthly Payout</p>
              <button onClick={() => setShowReturnPanel(true)}
                className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center bg-white/15 text-white">i</button>
            </div>
            <span className="text-lg font-extrabold text-[#05CE78]">{fmt(m.monthlyPayoutL)}</span>
          </div>
          {/* Avg Annual Return */}
          <div className="relative bg-[#0B1120] rounded-xl px-3 py-2.5 flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">Avg Return <span className="font-normal text-gray-500 normal-case tracking-normal">p.a.</span></p>
              <button onClick={() => setShowReturnPanel(true)}
                className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center bg-white/15 text-white">i</button>
            </div>
            <span className="text-lg font-extrabold text-[#05CE78]">{m.annualReturnPct.toFixed(1)}%</span>
          </div>
        </div>

        {scrolled && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#05CE78] text-white py-3 rounded-2xl font-bold text-sm shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_20px_rgba(5,206,120,0.3)] transition-all active:scale-95 mt-2">
            <MessageCircle className="w-4 h-4" />
            Express Interest on WhatsApp
          </a>
        )}
      </div>

      {/* Mobile Return Breakdown panel */}
      {showReturnPanel && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowReturnPanel(false)} />
          <div className="fixed top-16 bottom-20 right-3 w-60 bg-white z-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-[#05CE78]" /> Return Breakdown
              </p>
              <button onClick={() => setShowReturnPanel(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {[
                  { label: "Revenue/trip", formula: `₹${ticketPrice}×34×2×${occupancyPct}%`, value: fmtRs(m.revenuePerTrip) },
                  { label: "MG/trip", formula: "Fuel+tyres+maintenance", value: fmtRs(m.mgPerTrip), muted: true },
                  { label: "Profit/trip", formula: `(Rev−MG)×50%`, value: fmtRs(m.profitPerTrip) },
                  { label: "A = ×28 trips", formula: `${fmtRs(m.profitPerTrip)}×28`, value: fmtRs(m.A * 100000) },
                  { label: "B = GST credit", formula: "Fixed monthly", value: fmtRs(m.B * 100000) },
                  { label: "I1 = (A+B−EMI)×75%", formula: "", value: fmtRs(m.I1 * 100000) },
                  { label: "I2 = MG savings×40%", formula: "", value: fmtRs(m.I2 * 100000) },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-start pb-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className={`text-[10px] font-semibold ${row.muted ? "text-gray-400" : "text-gray-700"}`}>{row.label}</p>
                      {row.formula ? <p className="text-[9px] text-gray-400 font-mono leading-tight">{row.formula}</p> : null}
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums ml-2 shrink-0 ${row.muted ? "text-gray-400" : "text-gray-900"}`}>{row.value}</span>
                  </div>
                ))}

                <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 flex justify-between items-center">
                  <p className="text-[10px] font-bold text-gray-600">Pool = I1+I2</p>
                  <span className="text-[10px] font-bold text-gray-900">{fmtRs(m.totalPoolPayoutL * 100000)}</span>
                </div>

                <div className="bg-[#05CE78]/10 border border-[#05CE78]/20 rounded-lg px-2.5 py-2 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-[#05CE78]">Your payout</p>
                    <p className="text-[9px] text-gray-400 font-mono">Pool×{(m.investorShare*100).toFixed(2)}%</p>
                  </div>
                  <span className="text-sm font-extrabold text-[#05CE78]">{fmt(m.monthlyPayoutL)}</span>
                </div>

                <div className="bg-[#0B1120] rounded-lg px-2.5 py-2 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Avg Annual Return</span>
                  <span className="text-sm font-extrabold text-[#05CE78]">{m.annualReturnPct.toFixed(1)}%</span>
                </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Exit Value panel */}
      {showLocalExitPanel && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowLocalExitPanel(false)} />
          <div className="fixed top-16 bottom-20 right-3 w-60 bg-white z-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Bus className="w-3 h-3 text-[#05CE78]" /> Exit Value
              </p>
              <button onClick={() => setShowLocalExitPanel(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
            </div>
            <div className="flex-1 px-3 py-3 overflow-hidden space-y-3">
              <p className="text-[10px] text-gray-500 leading-relaxed">Fleet of 8 buses sold at end of Year 5. Bank loan fully paid off via EMIs.</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex justify-between items-center px-3 py-2.5 border-b border-gray-50">
                  <span className="text-[10px] text-gray-500">Fleet resale (30%)</span>
                  <span className="text-xs font-semibold text-gray-800">{fmt(m.resaleL)}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 border-b border-gray-50">
                  <span className="text-[10px] text-gray-500">Capital returned</span>
                  <span className="text-xs font-semibold text-gray-800">{fmt(L(TOTAL_EQUITY_RS))}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 border-b border-gray-50">
                  <span className="text-[10px] text-gray-500">Net gain</span>
                  <span className="text-xs font-semibold text-gray-800">{fmt(m.capitalGainL)}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 border-b border-gray-100">
                  <span className="text-[10px] text-gray-500">Investor share (40%)</span>
                  <span className="text-xs font-semibold text-[#05CE78]">{fmt(m.investorGainL)}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 bg-[#05CE78]/5">
                  <span className="text-xs font-semibold text-[#05CE78]">Your exit value</span>
                  <span className="text-xs font-bold text-[#05CE78]">{fmt(m.exitValueL)}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">Principal back + 40% of net capital gain shared with investors</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── Mobile content ─────────────────────────────────────────────────────────────
function MobileContent({
  investmentL, setInvestmentL,
  ticketPrice, setTicketPrice,
  m, waLink,
}: {
  investmentL: number; setInvestmentL: (v: number) => void;
  ticketPrice: number; setTicketPrice: (v: number) => void;
  m: ReturnType<typeof calcModel>;
  waLink: string;
}) {
  const [showExitPanel, setShowExitPanel] = useState(false);
  const [showHowPanel, setShowHowPanel] = useState(false);

  useEffect(() => {
    document.body.style.overflow = (showExitPanel || showHowPanel) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showExitPanel, showHowPanel]);

  return (
    <>
      <div className="pb-36">
        {/* Top bar */}
        <div className="bg-[#0B1120] flex items-center justify-between px-4 py-3">
          <Link href="/opportunities/transportation/pool-6"
            className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Pool-6
          </Link>
          <div className="flex items-center gap-1.5 text-[#05CE78] text-xs font-bold tracking-widest uppercase">
            <BarChart3 className="w-3 h-3" /> Simulator
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">

          {/* Total Asset Value card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Asset Value</p>
              <p className="text-2xl font-extrabold text-gray-900">₹8 Cr</p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-sm text-gray-600">Debt <span className="font-bold text-gray-900">75%</span></p>
              <p className="text-sm text-gray-600">Equity <span className="font-bold text-gray-900">25%</span></p>
              <p className="text-sm text-gray-600">Buses <span className="font-bold text-gray-900">8</span></p>
            </div>
          </div>

          {/* Ticket Price slider */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Avg Ticket Price</p>
                <p className="text-xs text-gray-500">Adjust expected per-seat fare</p>
              </div>
              <span className="text-xl font-extrabold text-gray-900 bg-gray-50 border border-gray-200 px-3 py-1 rounded-xl">₹{ticketPrice}</span>
            </div>
            <input type="range" min={800} max={2500} step={50} value={ticketPrice}
              onChange={e => setTicketPrice(Number(e.target.value))}
              className="onya-slider" style={sliderStyle(ticketPrice, 800, 2500)} />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-400 font-bold">₹800 · Seater</span>
              <span className="text-[10px] text-gray-400 font-bold">₹2500 · Premium</span>
            </div>
          </div>

          {/* Your Investment */}
          <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-[#05CE78] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bus className="w-3 h-3" /> Your Investment
            </p>
            <p className="text-3xl font-extrabold text-gray-900 mb-3">{fmt(investmentL)}</p>
            <input type="range" min={5} max={200} step={5} value={investmentL}
              onChange={e => setInvestmentL(Number(e.target.value))}
              className="onya-slider" style={sliderStyle(investmentL, 5, 200)} />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-500 font-bold">Min ₹5L</span>
              <span className="text-[10px] text-gray-500 font-bold">Max ₹2Cr</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Equity share: <span className="font-bold text-gray-700">{(m.investorShare * 100).toFixed(2)}%</span> of pool
            </p>
          </div>

          {/* Total Payouts */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Payouts (5 Yrs)</p>
            <p className="text-2xl font-extrabold text-gray-900">{fmt(m.totalPayouts60L)}</p>
            <p className="text-xs text-gray-400 mt-1">60 monthly payouts · 75% profit share</p>
          </div>

          {/* Panel triggers */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowExitPanel(true)}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-left active:bg-gray-50">
              <Bus className="w-4 h-4 text-[#05CE78] mb-2" />
              <p className="text-xs font-bold text-gray-700">Exit Value</p>
              <p className="text-sm font-extrabold text-[#05CE78] mt-0.5">{fmt(m.exitValueL)}</p>
            </button>
            <button onClick={() => setShowHowPanel(true)}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-left active:bg-gray-50">
              <Info className="w-4 h-4 text-blue-500 mb-2" />
              <p className="text-xs font-bold text-gray-700">How Returns Work</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Revenue → profit → payout</p>
            </button>
          </div>

          {/* WhatsApp CTA */}
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#05CE78] text-white py-4 rounded-2xl font-bold text-base shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] transition-all active:scale-95">
            <MessageCircle className="w-5 h-5" />
            Express Interest on WhatsApp
          </a>
        </div>
      </div>

      {/* Exit Value panel */}
      {showExitPanel && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowExitPanel(false)} />
          <div className="fixed top-16 bottom-20 right-3 w-64 bg-white z-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Bus className="w-3 h-3 text-[#05CE78]" /> Exit Value
              </p>
              <button onClick={() => setShowExitPanel(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
            </div>
            <div className="flex-1 px-3 py-3 overflow-hidden space-y-3">
              <p className="text-[10px] text-gray-500 leading-relaxed">Fleet of 8 buses sold at end of Year 5. Bank loan fully paid off via EMIs.</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex justify-between items-center px-3 py-2.5 border-b border-gray-50">
                  <span className="text-[10px] text-gray-500">Fleet resale (30%)</span>
                  <span className="text-xs font-semibold text-gray-800">{fmt(m.resaleL)}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 border-b border-gray-50">
                  <span className="text-[10px] text-gray-500">Capital returned</span>
                  <span className="text-xs font-semibold text-gray-800">{fmt(L(TOTAL_EQUITY_RS))}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 border-b border-gray-50">
                  <span className="text-[10px] text-gray-500">Net gain</span>
                  <span className="text-xs font-semibold text-gray-800">{fmt(m.capitalGainL)}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 border-b border-gray-100">
                  <span className="text-[10px] text-gray-500">Investor share (40%)</span>
                  <span className="text-xs font-semibold text-[#05CE78]">{fmt(m.investorGainL)}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2.5 bg-[#05CE78]/5">
                  <span className="text-xs font-semibold text-[#05CE78]">Your exit value</span>
                  <span className="text-xs font-bold text-[#05CE78]">{fmt(m.exitValueL)}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">Principal back + 40% of net capital gain shared with investors</p>
            </div>
          </div>
        </>
      )}

      {/* How Returns Work panel */}
      {showHowPanel && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowHowPanel(false)} />
          <div className="fixed top-16 bottom-20 right-3 w-64 bg-white z-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-[#05CE78]" /> How Returns Work
              </p>
              <button onClick={() => setShowHowPanel(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
            </div>
            <div className="flex-1 px-3 py-3 overflow-hidden space-y-3">
              {[
                { step: "A", label: "Profit × 28 trips", value: fmt(m.A), note: "(Revenue − MG) × 50% × 28" },
                { step: "B", label: "GST Input Credit", value: fmt(m.B), note: "Fixed monthly claim" },
                { step: "I1", label: "(A + B − EMI) × 75%", value: fmt(m.I1), note: "Core investor pool", small: true },
                { step: "I2", label: "MG Savings × 40%", value: fmt(m.I2), note: "Savings efficiency share" },
                { step: "=", label: "Your Monthly Payout", value: fmt(m.monthlyPayoutL), note: `(I1 + I2) × ${(m.investorShare * 100).toFixed(2)}% share`, green: true },
              ].map(r => (
                <div key={r.step} className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full bg-[#05CE78]/15 text-[#05CE78] font-black flex items-center justify-center shrink-0 mt-0.5 ${r.small ? "text-[8px]" : "text-[9px]"}`}>{r.step}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">{r.label}</span>
                      <span className={`text-xs font-bold ${r.green ? "text-[#05CE78]" : "text-gray-900"}`}>{r.value}</span>
                    </div>
                    <p className="text-[10px] text-gray-400">{r.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── New simulator (not active — kept for future use) ──────────────────────────
function Pool6FinancialBreakdown() {
  const [investmentL, setInvestmentL] = useState(10);
  const [ticketPrice, setTicketPrice] = useState(1050);
  const [occupancyPct, setOccupancyPct] = useState(85);
  const [showDesktopExit, setShowDesktopExit] = useState(false);
  const [showDesktopHow, setShowDesktopHow] = useState(false);
  const [showDesktopReturn, setShowDesktopReturn] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = (showDesktopExit || showDesktopHow || showDesktopReturn) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showDesktopExit, showDesktopHow, showDesktopReturn]);

  const m = useMemo(() => calcModel(investmentL, ticketPrice, occupancyPct), [investmentL, ticketPrice, occupancyPct]);

  const waLink = `https://wa.me/919000272020?text=${encodeURIComponent("Hi, I'm interested in investing in Pool-6 Fleet Fund.")}`;

  if (!mounted) return <div className="bg-gray-50 min-h-screen" />;

  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-[#05CE78] selection:text-white">
      <style>{`
        input[type='range'].onya-slider{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;outline:none;cursor:pointer;width:100%}
        input[type='range'].onya-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:32px;height:22px;border-radius:11px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.45);cursor:pointer;border:none}
        input[type='range'].onya-slider::-moz-range-thumb{width:32px;height:22px;border-radius:11px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.45);cursor:pointer;border:none}
      `}</style>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex flex-col bg-gray-50" style={{ height: "calc(100dvh - 80px)" }}>

        {/* Top bar */}
        <div className="bg-[#0B1120] flex items-center justify-between px-8 py-4 shrink-0">
          <Link href="/opportunities/transportation/pool-6"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition group text-sm font-medium">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Pool-6
          </Link>
          <div className="flex items-center gap-2 text-[#05CE78] text-xs font-bold tracking-widest uppercase">
            <BarChart3 className="w-3.5 h-3.5" /> Financial Breakdown
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-5xl mx-auto px-8 py-6 space-y-4">

            {/* Row 1: Total Asset Value + Ticket Price slider */}
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Asset Value</p>
                  <p className="text-2xl font-extrabold text-gray-900">₹8 Cr</p>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-sm text-gray-600">Debt <span className="font-bold text-gray-900">75%</span></p>
                  <p className="text-sm text-gray-600">Equity <span className="font-bold text-gray-900">25%</span></p>
                  <p className="text-sm text-gray-600">Buses <span className="font-bold text-gray-900">8</span></p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5">
                {/* Ticket Price */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Ticket Price</p>
                      <p className="text-xs text-gray-500">Per-seat fare per trip</p>
                    </div>
                    <span className="text-xl font-extrabold text-gray-900 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl shrink-0 ml-4">₹{ticketPrice}</span>
                  </div>
                  <input type="range" min={800} max={2500} step={50} value={ticketPrice}
                    onChange={e => setTicketPrice(Number(e.target.value))}
                    className="onya-slider" style={sliderStyle(ticketPrice, 800, 2500)} />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400 font-bold">₹800 · Seater</span>
                    <span className="text-[10px] text-gray-400 font-bold">₹2500 · Sleeper</span>
                  </div>
                </div>
                {/* Occupancy Rate */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Occupancy Rate</p>
                      <p className="text-xs text-gray-500">Seats filled per trip</p>
                    </div>
                    <span className="text-xl font-extrabold text-gray-900 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl shrink-0 ml-4">{occupancyPct}%</span>
                  </div>
                  <input type="range" min={50} max={100} step={5} value={occupancyPct}
                    onChange={e => setOccupancyPct(Number(e.target.value))}
                    className="onya-slider" style={sliderStyle(occupancyPct, 50, 100)} />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400 font-bold">50% · Low</span>
                    <span className="text-[10px] text-gray-400 font-bold">100% · Full</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Your Investment | Total Payouts | panel triggers */}
            <div className="grid grid-cols-[0.8fr_0.8fr_1.4fr] gap-4 items-start">

              {/* Your Investment */}
              <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-2xl p-4 relative overflow-hidden">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#05CE78] uppercase tracking-wider mb-2">
                  <Bus className="w-3 h-3" /> Your Investment
                </p>
                <p className="text-3xl font-extrabold text-gray-900 mb-3">{fmt(investmentL)}</p>
                <input type="range" min={5} max={200} step={5} value={investmentL}
                  onChange={e => setInvestmentL(Number(e.target.value))}
                  className="onya-slider" style={sliderStyle(investmentL, 5, 200)} />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-gray-500 font-bold">₹5L</span>
                  <span className="text-[10px] text-gray-500 font-bold">₹2Cr</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Equity share <span className="font-bold text-gray-700">{(m.investorShare * 100).toFixed(2)}%</span>
                </p>
              </div>

              {/* Total Payouts */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Payouts</p>
                <p className="text-2xl font-extrabold text-gray-900">{fmt(m.totalPayouts60L)}</p>
                <p className="text-xs text-gray-400 mt-1">60 monthly · 75% profit share</p>
              </div>

              {/* Panel triggers */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowDesktopExit(v => !v)}
                  className={`rounded-2xl p-4 text-left border transition-all ${showDesktopExit ? "bg-[#0B1120] border-[#05CE78]/30" : "bg-white border-gray-200 hover:border-gray-300"}`}>
                  <Bus className={`w-4 h-4 mb-2 ${showDesktopExit ? "text-[#05CE78]" : "text-[#05CE78]"}`} />
                  <p className={`text-xs font-bold ${showDesktopExit ? "text-white" : "text-gray-700"}`}>Exit Value</p>
                  <p className="text-sm font-extrabold text-[#05CE78] mt-0.5">{fmt(m.exitValueL)}</p>
                </button>
                <button onClick={() => setShowDesktopHow(v => !v)}
                  className={`rounded-2xl p-4 text-left border transition-all ${showDesktopHow ? "bg-[#0B1120] border-[#05CE78]/30" : "bg-white border-gray-200 hover:border-gray-300"}`}>
                  <Info className={`w-4 h-4 mb-2 ${showDesktopHow ? "text-blue-400" : "text-blue-500"}`} />
                  <p className={`text-xs font-bold ${showDesktopHow ? "text-white" : "text-gray-700"}`}>How Returns Work</p>
                  <p className={`text-[10px] mt-0.5 ${showDesktopHow ? "text-gray-400" : "text-gray-400"}`}>Revenue → profit → payout</p>
                </button>
              </div>
            </div>

            {/* Row 3: Monthly Payout | Avg Annual Return | WhatsApp CTA */}
            <div className="grid grid-cols-3 gap-4">
              <div className="relative bg-[#0B1120] rounded-2xl px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Payout</p>
                  <button onClick={() => setShowDesktopReturn(v => !v)}
                    className={`w-7 h-7 rounded-full text-sm font-black flex items-center justify-center transition-all ${showDesktopReturn ? "bg-[#05CE78] text-white shadow-[0_0_12px_rgba(5,206,120,0.5)]" : "bg-white/15 text-white hover:bg-white/25"}`}>i</button>
                </div>
                <span className="text-2xl font-extrabold text-[#05CE78]">{fmt(m.monthlyPayoutL)}</span>
                <p className="text-xs text-gray-500 mt-1">Your share of profit pool</p>
              </div>

              <div className="relative bg-[#0B1120] rounded-2xl px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Annual Return</p>
                  <button onClick={() => setShowDesktopReturn(v => !v)}
                    className={`w-7 h-7 rounded-full text-sm font-black flex items-center justify-center transition-all ${showDesktopReturn ? "bg-[#05CE78] text-white shadow-[0_0_12px_rgba(5,206,120,0.5)]" : "bg-white/15 text-white hover:bg-white/25"}`}>i</button>
                </div>
                <span className="text-2xl font-extrabold text-[#05CE78]">{m.annualReturnPct.toFixed(1)}%</span>
                <p className="text-xs text-gray-500 mt-1">Payout-based · excludes exit</p>
              </div>

              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-[#05CE78] text-white rounded-2xl font-bold text-base shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] transition-all hover:bg-[#04b067] active:scale-95 px-6">
                <MessageCircle className="w-5 h-5" />
                Express Interest on WhatsApp
              </a>
            </div>

          </div>
        </div>

        {/* Desktop sticky footer height reference */}
        <div className="shrink-0 h-[88px] bg-gray-50 border-t border-gray-100 flex items-center px-8">
          <p className="text-xs text-gray-400">Pool-6 · 8 Ashok Leyland Sleeper Buses · ₹8 Cr Asset · 75:25 Debt-Equity · 5-Year Tenure</p>
        </div>

        {/* Desktop panels */}
        {showDesktopExit && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowDesktopExit(false)} />
            <div className="fixed top-[80px] bottom-[88px] right-0 w-[420px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Bus className="w-4 h-4 text-[#05CE78]" /> Exit Value Breakdown
                </p>
                <button onClick={() => setShowDesktopExit(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <p className="text-sm text-gray-500 leading-relaxed">At Year 5, the fleet of 8 buses is liquidated. The bank loan is fully cleared by operational EMIs over 5 years.</p>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  {[
                    { label: "Fleet resale value (30% of ₹8Cr)", value: fmt(m.resaleL) },
                    { label: "Investor capital returned", value: fmt(L(TOTAL_EQUITY_RS)) },
                    { label: "Net capital gain", value: fmt(m.capitalGainL) },
                    { label: "Investor share of gain (40%)", value: fmt(m.investorGainL), green: true },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-3 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.green ? "text-[#05CE78]" : "text-gray-800"}`}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-[#05CE78]/5">
                    <span className="text-sm font-semibold text-[#05CE78]">Your exit value</span>
                    <span className="text-sm font-bold text-[#05CE78]">{fmt(m.exitValueL)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 italic">Principal fully returned + 40% of net gain distributed to investors proportionally.</p>
              </div>
            </div>
          </>
        )}

        {showDesktopHow && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowDesktopHow(false)} />
            <div className="fixed top-[80px] bottom-[88px] right-0 w-[420px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#05CE78]" /> How Returns Work
                </p>
                <button onClick={() => setShowDesktopHow(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {[
                  { step: "A", label: "Profit × 28 trips", value: fmt(m.A), note: "(Revenue − MG) × 50% × 28 trips/month" },
                  { step: "B", label: "GST Input Credit", value: fmt(m.B), note: "Fixed monthly GST claim from bus purchase" },
                  { step: "I1", label: "(A + B − EMI) × 75%", value: fmt(m.I1), note: "Core investor pool after EMI deduction" },
                  { step: "I2", label: "MG Savings × 40%", value: fmt(m.I2), note: "Efficiency savings passed to investors" },
                  { step: "=", label: "Your Monthly Payout", value: fmt(m.monthlyPayoutL), note: `(I1 + I2) × ${(m.investorShare * 100).toFixed(2)}% equity share`, green: true },
                ].map(r => (
                  <div key={r.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#05CE78]/15 text-[#05CE78] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{r.step}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-sm font-semibold text-gray-700">{r.label}</span>
                        <span className={`text-sm font-bold ${r.green ? "text-[#05CE78]" : "text-gray-900"}`}>{r.value}</span>
                      </div>
                      <p className="text-xs text-gray-400">{r.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {showDesktopReturn && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowDesktopReturn(false)} />
            <div className="fixed top-[80px] bottom-[88px] right-0 w-[420px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#05CE78]" /> Return Breakdown
                </p>
                <button onClick={() => setShowDesktopReturn(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                {[
                  { label: "Revenue per trip", formula: `₹${ticketPrice} × 34 seats × 2 buses × ${occupancyPct}%`, value: fmtRs(m.revenuePerTrip) },
                  { label: "MG per trip", formula: "Fuel + tyres + maintenance + ...", value: fmtRs(m.mgPerTrip), muted: true },
                  { label: "Profit share per trip", formula: `(${fmtRs(m.revenuePerTrip)} − ${fmtRs(m.mgPerTrip)}) × 50%`, value: fmtRs(m.profitPerTrip) },
                  { label: "A = Profit × 28 trips", formula: `${fmtRs(m.profitPerTrip)} × 28`, value: fmtRs(m.A * 100000) },
                  { label: "B = GST input credit", formula: "Fixed monthly claim", value: fmtRs(m.B * 100000) },
                  { label: "I1 = (A + B − EMI) × 75%", formula: `(${fmtRs(m.A * 100000)} + ${fmtRs(m.B * 100000)} − ₹2,85,000) × 75%`, value: fmtRs(m.I1 * 100000) },
                  { label: "I2 = MG savings × 40%", formula: `${fmtRs(m.C * 100000)} × 40%`, value: fmtRs(m.I2 * 100000) },
                ].map((row, i) => (
                  <div key={i} className="pb-3 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-sm font-semibold ${row.muted ? "text-gray-400" : "text-gray-700"}`}>{row.label}</span>
                      <span className={`text-sm font-bold tabular-nums ${row.muted ? "text-gray-400" : "text-gray-900"}`}>{row.value}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{row.formula}</p>
                  </div>
                ))}

                <div className="border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center bg-gray-50">
                  <div>
                    <p className="text-sm font-bold text-gray-700">Pool payout = I1 + I2</p>
                    <p className="text-xs text-gray-400 font-mono">{fmtRs(m.I1 * 100000)} + {fmtRs(m.I2 * 100000)}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{fmtRs(m.totalPoolPayoutL * 100000)}</span>
                </div>

                <div className="bg-[#05CE78]/10 border border-[#05CE78]/20 rounded-xl px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-[#05CE78]">Your monthly payout</p>
                    <p className="text-xs text-gray-400 font-mono">Pool × {(m.investorShare * 100).toFixed(2)}% equity share</p>
                  </div>
                  <span className="text-lg font-extrabold text-[#05CE78]">{fmt(m.monthlyPayoutL)}</span>
                </div>

                <div className="bg-[#0B1120] rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Annual Return</span>
                  <span className="text-xl font-extrabold text-[#05CE78]">{m.annualReturnPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MOBILE ── */}
      <div className="md:hidden">
        <MobileContent
          investmentL={investmentL} setInvestmentL={setInvestmentL}
          ticketPrice={ticketPrice} setTicketPrice={setTicketPrice}
          m={m} waLink={waLink}
        />
        <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
          <MobileSticky m={m} investmentL={investmentL} ticketPrice={ticketPrice} occupancyPct={occupancyPct} waLink={waLink} />
        </div>
      </div>
    </div>
  );
}
// ── Active default export — original business model page ──────────────────────
const capexBreakdown = [
  { item: "8 x Ashok Leyland Chassis (13.5M)", amount: 38400000 },
  { item: "8 x Premium Body Building (Sleeper)", amount: 25600000 },
  { item: "AITP Registration & Permits", amount: 6400000 },
  { item: "Fleet Insurance (1st Year)", amount: 4800000 },
  { item: "Tech Integration (GPS/CCTV)", amount: 2400000 },
  { item: "Working Capital Reserve", amount: 2400000 },
];

const fixedOpexData = [
  { item: "Driver & Crew Salaries (24 Staff)", amount: 960000 },
  { item: "Garage & Parking Rent", amount: 120000 },
  { item: "Admin & Management Fee", amount: 200000 },
  { item: "Route Permits (Monthly)", amount: 320000 },
];

export default function Pool6BusinessModelPage() {
  const [investmentAmount, setInvestmentAmount] = useState(1000000);
  const [occupancy] = useState(85);
  const [avgTicketPrice, setAvgTicketPrice] = useState(1050);
  const [dieselPrice] = useState(95);
  const [showCapexModal, setShowCapexModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"revenue" | "opex">("revenue");

  const TOTAL_ASSET_VALUE = 80000000;
  const DEBT_RATIO = 0.75;
  const TOTAL_DEBT = TOTAL_ASSET_VALUE * DEBT_RATIO;
  const TOTAL_EQUITY = TOTAL_ASSET_VALUE * (1 - DEBT_RATIO);
  const MONTHLY_EMI = 920000;
  const TOTAL_BUSES = 8;
  const SEATS_PER_BUS = 40;
  const DAILY_KM = 750;
  const MILEAGE = 4.0;

  const monthlyRevenue = Math.round(
    TOTAL_BUSES * SEATS_PER_BUS * (occupancy / 100) * avgTicketPrice * 30 +
    TOTAL_BUSES * 2000 * 30
  );
  const fuelCost = Math.round((TOTAL_BUSES * DAILY_KM / MILEAGE) * dieselPrice * 30);
  const tollsCost = TOTAL_BUSES * 3000 * 30;
  const fixedCost = fixedOpexData.reduce((a, i) => a + i.amount, 0);
  const commission = Math.round(monthlyRevenue * 0.12);
  const totalExpenses = fuelCost + tollsCost + fixedCost + commission + MONTHLY_EMI;
  const netProfitPostEMI = monthlyRevenue - totalExpenses;
  const distributableInvestorPool = Math.round(netProfitPostEMI * 0.75);
  const userEquityShare = investmentAmount / TOTAL_EQUITY;
  const userMonthlyCashflow = Math.round(distributableInvestorPool * userEquityShare);
  const RESALE_VALUE = TOTAL_ASSET_VALUE * 0.30;
  const capitalGain = RESALE_VALUE - TOTAL_EQUITY;
  const investorShareOfGain = capitalGain > 0 ? capitalGain * 0.40 : 0;
  const totalExitPayoutToPool = TOTAL_EQUITY + investorShareOfGain;
  const userExitPayout = Math.round(totalExitPayoutToPool * userEquityShare);
  const totalOperationalIncome5Y = userMonthlyCashflow * 60;
  const totalLifetimeReturn = totalOperationalIncome5Y + userExitPayout;
  const annualROI = (((totalLifetimeReturn - investmentAmount) / 5) / investmentAmount) * 100;

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900">
      <div className="relative bg-[#0B1120] pt-24 pb-48 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto mb-8 relative z-10">
          <Link href="/opportunities/transportation/pool-6" className="inline-flex items-center text-gray-400 hover:text-white transition">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Pool-6
          </Link>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] text-xs font-bold tracking-widest uppercase mb-6">
            <BarChart3 className="w-3 h-3" /> Leveraged ROI Simulator
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Project Your <span className="text-[#05CE78]">Total Returns</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Includes Monthly Cashflow + Terminal Value (Bus Sale after 5 Years).
          </p>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20 space-y-12 pb-32">
        <section className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-10">
            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-[#05CE78]" /> Investment (Equity)
                  </label>
                  <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">
                    {formatCurrency(investmentAmount)}
                  </div>
                </div>
                <input type="range" min={500000} max={20000000} step={500000} value={investmentAmount}
                  onChange={e => setInvestmentAmount(Number(e.target.value))}
                  className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between text-xs text-gray-400 font-medium"><span>Min: Rs.5L</span><span>Max: Rs.2 Cr</span></div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    <Bus className="w-4 h-4 text-[#05CE78]" /> Avg Ticket Price
                  </label>
                  <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">
                    {formatCurrency(avgTicketPrice)}
                  </div>
                </div>
                <input type="range" min={800} max={2500} step={50} value={avgTicketPrice}
                  onChange={e => setAvgTicketPrice(Number(e.target.value))}
                  className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between text-xs text-gray-400 font-medium"><span>Rs.800 (Seater)</span><span>Rs.2500 (Premium)</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Info className="w-3 h-3" /> Monthly Payout
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(userMonthlyCashflow)}</div>
                <div className="text-xs text-gray-500">Your Share (75% Split)</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#05CE78] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">75% SPLIT</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Investor Pot</div>
                <div className="text-2xl font-bold text-[#05CE78] mb-1">{formatCurrency(distributableInvestorPool)}</div>
                <div className="text-xs text-gray-500">Total Distributable to Pool</div>
              </div>
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg">TOTAL</div>
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#05CE78] blur-2xl opacity-20" />
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lifetime Return (5Y)</div>
                <div className="text-3xl font-extrabold text-[#05CE78] mb-1">{formatCurrency(totalLifetimeReturn)}</div>
                <div className="text-xs text-gray-400">Cashflow + Exit Proceeds</div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tenure</div>
                <div className="text-xl font-bold text-gray-900">5 Years</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Profit Share</div>
                <div className="text-xl font-bold text-gray-900">{(userEquityShare * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Multiplier</div>
                <div className={`text-xl font-bold ${totalLifetimeReturn < investmentAmount ? "text-red-500" : "text-gray-900"}`}>
                  {(totalLifetimeReturn / investmentAmount).toFixed(1)}x
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Annual ROI (IRR)</div>
                <div className={`text-xl font-bold ${annualROI < 0 ? "text-red-500" : "text-[#05CE78]"}`}>
                  {annualROI.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="bg-white p-4 rounded-full shadow-sm">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Exit Strategy: Fleet Liquidation (Year 5)</h3>
              <p className="text-blue-800 text-sm leading-relaxed mb-4">
                At the end of the 5-year tenure, the fleet of 8 buses will be sold. By this time, the bank loan will be fully paid off via operational EMIs.
              </p>
              <div className="bg-white/60 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-2 font-medium">
                <div className="flex justify-between"><span>1. Fleet Resale Value (Est.)</span><span>{formatCurrency(RESALE_VALUE)}</span></div>
                <div className="flex justify-between"><span>2. Return of Investor Capital</span><span>- {formatCurrency(TOTAL_EQUITY)}</span></div>
                <div className="flex justify-between text-[#05CE78] font-bold"><span>3. Net Capital Gain</span><span>{formatCurrency(capitalGain)}</span></div>
                <div className="pt-2 border-t border-blue-200 mt-2">
                  <span className="block mb-1">4. Profit Sharing Policy:</span>
                  <span className="text-blue-700">Investors receive 100% of their Principal back + <strong>40% of the Net Capital Gain</strong>.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Bus className="w-6 h-6 text-[#05CE78]" /> Operational P&L
            </h2>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button onClick={() => setActiveTab("revenue")} className={`flex-1 py-5 text-sm font-bold uppercase tracking-wide ${activeTab === "revenue" ? "text-[#05CE78] border-b-2 border-[#05CE78] bg-green-50/10" : "text-gray-400"}`}>Revenue Sources</button>
                <button onClick={() => setActiveTab("opex")} className={`flex-1 py-5 text-sm font-bold uppercase tracking-wide ${activeTab === "opex" ? "text-red-500 border-b-2 border-red-500 bg-red-50/10" : "text-gray-400"}`}>Expense Breakdown</button>
              </div>
              <div className="p-8">
                {activeTab === "revenue" ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-end mb-4 pb-4 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Gross Monthly Revenue</span>
                      <span className="text-3xl font-bold text-[#05CE78]">{formatCurrency(monthlyRevenue)}</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div><p className="font-bold text-gray-900 text-sm">Passenger Sales</p><p className="text-xs text-gray-500 mt-1">{TOTAL_BUSES} Buses ({SEATS_PER_BUS} Seats) x {occupancy}%</p></div>
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(monthlyRevenue - TOTAL_BUSES * 2000 * 30)}</p>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div><p className="font-bold text-gray-900 text-sm">Cargo Revenue</p><p className="text-xs text-gray-500 mt-1">Parcel & Logistics (Fixed)</p></div>
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(TOTAL_BUSES * 2000 * 30)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-end mb-4 pb-4 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Total Outflow (Inc. EMI)</span>
                      <span className="text-3xl font-bold text-red-500">{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold uppercase"><span className="text-gray-600">Fuel (Diesel)</span><span className="text-gray-900">{formatCurrency(fuelCost)}</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2"><div className="bg-gray-400 h-full rounded-full" style={{ width: "35%" }} /></div>
                      <div className="flex justify-between text-xs font-bold uppercase"><span className="text-red-600">Bank EMI (Debt)</span><span className="text-gray-900">{formatCurrency(MONTHLY_EMI)}</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2"><div className="bg-red-500 h-full rounded-full" style={{ width: "25%" }} /></div>
                      <div className="flex justify-between text-xs font-bold uppercase"><span className="text-gray-600">Operations & Admin</span><span className="text-gray-900">{formatCurrency(fixedCost + tollsCost + commission)}</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2"><div className="bg-gray-400 h-full rounded-full" style={{ width: "40%" }} /></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 sticky top-24">
            <div className="flex items-center justify-between mb-6 h-8">
              <h2 className="text-xl font-bold text-gray-900">Asset Value</h2>
              <button onClick={() => setShowCapexModal(true)} className="text-xs font-bold text-[#05CE78] uppercase hover:underline">View Breakdown</button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 border border-blue-100">
                <Info className="w-8 h-8" />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Pool CapEx</p>
              <p className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">{formatCurrency(TOTAL_ASSET_VALUE)}</p>
              <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100 text-left mb-6">
                <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Bank Debt (75%)</span><span className="font-bold text-gray-900">{formatCurrency(TOTAL_DEBT)}</span></div>
                <div className="w-full h-px bg-gray-200/50" />
                <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Equity Pool (25%)</span><span className="font-bold text-[#05CE78]">{formatCurrency(TOTAL_EQUITY)}</span></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
        <a href="https://wa.me/919000272020" target="_blank" rel="noopener noreferrer"
          className="pointer-events-auto bg-[#05CE78] hover:bg-[#04b067] text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-green-900/30 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
          <MessageCircle className="w-5 h-5" /> Start Investment
        </a>
      </div>

      {showCapexModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-gray-50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">CapEx: 8 Bus Fleet</h3>
              <button onClick={() => setShowCapexModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-8 space-y-4">
              {capexBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <span className="text-gray-600 font-medium">{item.item}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="pt-4 mt-2">
                <div className="flex justify-between items-center bg-[#05CE78]/10 p-4 rounded-xl border border-[#05CE78]/20">
                  <span className="font-bold text-[#05CE78] text-xs uppercase">Total Asset Value</span>
                  <span className="font-extrabold text-[#05CE78] text-lg">{formatCurrency(TOTAL_ASSET_VALUE)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
