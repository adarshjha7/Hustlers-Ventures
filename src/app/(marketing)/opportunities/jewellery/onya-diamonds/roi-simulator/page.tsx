"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Gem,
  MessageCircle,
  Pencil,
  X,
} from "lucide-react";

function fmt(lakhs: number) {
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(2)} Cr`;
  return `₹${lakhs.toFixed(1)}L`;
}

function calcModel(totalPoolL: number, investmentL: number, monthlyRevenueL: number) {
  const investorShare = investmentL / totalPoolL;
  const poolGuaranteedL = totalPoolL * 0.01;
  const poolRevenueLinkedL = monthlyRevenueL * 0.12;
  const poolMonthlyPayoutL = Math.max(poolGuaranteedL, poolRevenueLinkedL);
  const isRevenueLinked = poolRevenueLinkedL >= poolGuaranteedL;
  const monthlyPayoutL = poolMonthlyPayoutL * investorShare;
  const guaranteedMonthlyL = poolGuaranteedL * investorShare;
  const revenueLinkedL = poolRevenueLinkedL * investorShare;
  const inventoryShareL = totalPoolL * 0.70 * investorShare;
  const storeShareL = totalPoolL * 0.30 * investorShare;
  const totalPayouts60L = monthlyPayoutL * 60;
  const inventoryAtExitL = inventoryShareL * Math.pow(1.06, 5);
  const totalValueL = totalPayouts60L + inventoryAtExitL;
  const annualReturnPct = (totalPayouts60L / investmentL) * (1 / 5) * 100;
  return {
    investorShare, inventoryShareL, storeShareL,
    guaranteedMonthlyL, revenueLinkedL,
    monthlyPayoutL, isRevenueLinked,
    totalPayouts60L, inventoryAtExitL, totalValueL, annualReturnPct,
  };
}

function sliderStyle(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #05CE78 0%, #05CE78 ${pct}%, #b6b6b6 ${pct}%, #808080 100%)`,
  };
}

export default function OnyaROISimulator() {
  const [totalPoolL] = useState(200);
  const [investmentL, setInvestmentL] = useState(10);
  const [monthlyRevenueL, setMonthlyRevenueL] = useState(40);
  const [editing, setEditing] = useState(false);
  const [showDesktopAdvanced, setShowDesktopAdvanced] = useState(false);
  const [showDesktopHowReturns, setShowDesktopHowReturns] = useState(false);
  const [showBarPayoutInfo, setShowBarPayoutInfo] = useState(false);
  const [showReturnPanel, setShowReturnPanel] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = (showDesktopAdvanced || showDesktopHowReturns || showReturnPanel) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showDesktopAdvanced, showDesktopHowReturns, showReturnPanel]);

  const m = useMemo(
    () => calcModel(totalPoolL, investmentL, monthlyRevenueL),
    [totalPoolL, investmentL, monthlyRevenueL]
  );

  const waLink = `https://wa.me/919000272020?text=${encodeURIComponent("Hi, I'm interested in investing in Onya Diamonds.")}`;

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
          <Link href="/opportunities/jewellery/onya-diamonds"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition group text-sm font-medium">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Onya Diamonds
          </Link>
          <div className="flex items-center gap-2 text-[#05CE78] text-xs font-bold tracking-widest uppercase">
            <BarChart3 className="w-3.5 h-3.5" /> Simulator
          </div>
        </div>

        {/* Scrollable content + floating sticky bar */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-5xl mx-auto px-8 py-6 space-y-4">

            {/* Row 1: Total Project Cost + enlarged Monthly Revenue */}
            <div className="grid grid-cols-[1fr_2fr] gap-4">

              {/* Total Project Cost */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Project Cost</p>
                  <p className="text-2xl font-extrabold text-gray-900">₹2 Cr</p>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-s text-gray-600">Inventory <span className="font-bold text-gray-900">70%</span></p>
                  <p className="text-s text-gray-600">Store <span className="font-bold text-gray-900">30%</span></p>
                </div>
              </div>

              {/* Monthly Revenue Simulator */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Monthly Revenue Simulator</p>
                    <p className="text-xs text-gray-500">Adjust the expected store revenue to see updated returns</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="text-xl font-extrabold text-gray-900 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">{fmt(monthlyRevenueL)}</span>
                  </div>
                </div>
                <input type="range" min={5} max={100} step={5} value={monthlyRevenueL}
                  onChange={e => setMonthlyRevenueL(Number(e.target.value))}
                  className="onya-slider" style={sliderStyle(monthlyRevenueL, 5, 100)} />
                <div className="flex justify-between mt-2.5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Minimum</p>
                    <p className="text-xs font-bold text-gray-500">₹5L/mo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target</p>
                    <p className="text-xs font-bold text-gray-500">₹1 Cr/mo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Your Investment | Total Payouts | panel triggers */}
            <div className="grid grid-cols-[0.8fr_0.8fr_1.4fr] gap-4 items-start">

              {/* Your Investment */}
              <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-2xl p-4 relative overflow-hidden">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#05CE78] uppercase tracking-wider mb-2">
                  <Gem className="w-3 h-3" /> Your Investment
                </p>
                <Gem className="absolute top-3 right-3 w-9 h-9 text-[#05CE78]/10" />
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-extrabold text-gray-900">{fmt(investmentL)}</p>
                  <button onClick={() => setEditing(v => !v)}
                    className="flex items-center gap-1 text-xs text-[#05CE78] font-bold hover:bg-[#05CE78]/20 px-2 py-0.5 rounded-lg transition-colors">
                    <Pencil className="w-3 h-3" /> {editing ? "Done" : "Edit"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{(m.investorShare * 100).toFixed(1)}% share</p>
              </div>

              {/* Total Payouts */}
              <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#05CE78] uppercase tracking-wider mb-2">
                  Total Payouts
                </p>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{fmt(m.totalPayouts60L)}</p>
                  <p className="text-xs text-gray-400 mt-1">over 5 year tenure</p>
                </div>
              </div>

              {/* Col 3: panel triggers + disclaimer */}
              <div className="space-y-3">
                <button onClick={() => setShowDesktopAdvanced(true)}
                  className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <BarChart3 className="w-4 h-4 text-gray-400" /> Exit Value &amp; Total Value
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                </button>
                <button onClick={() => setShowDesktopHowReturns(true)}
                  className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <Gem className="w-3.5 h-3.5 text-[#05CE78]" /> How Returns Work
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                </button>
                <p className="text-xs text-gray-400 text-center px-2">* Projections are illustrative based on financial models. Past performance of other stores is not indicative of future returns.</p>
              </div>
            </div>

            {/* Investment slider — shown when editing */}
            {editing && (
              <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-2xl px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#05CE78] uppercase tracking-wider">Adjust Investment</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-gray-900">{fmt(investmentL)}</span>
                    <button onClick={() => setEditing(false)}
                      className="w-6 h-6 rounded-lg bg-[#0B1120] text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <input type="range" min={5} max={totalPoolL} step={5} value={investmentL}
                  onChange={e => setInvestmentL(Number(e.target.value))}
                  className="onya-slider" style={sliderStyle(investmentL, 5, totalPoolL)} />
                <div className="flex justify-between text-xs text-gray-400 mt-1.5"><span>₹5L min</span><span>{fmt(totalPoolL)}</span></div>
              </div>
            )}

            {/* Row 3: Monthly Payout | Avg Annual Return | WhatsApp CTA */}
            <div className="grid grid-cols-3 gap-4">
              <div className="relative bg-[#0B1120] rounded-2xl px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Payout</p>
                  <button onClick={() => setShowBarPayoutInfo(v => !v)}
                    className={`w-7 h-7 rounded-full text-sm font-black flex items-center justify-center transition-all ${showBarPayoutInfo ? "bg-[#05CE78] text-white shadow-[0_0_12px_rgba(5,206,120,0.5)]" : "bg-white/15 text-white hover:bg-white/25"}`}>i</button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-[#05CE78]">{fmt(m.monthlyPayoutL)}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.isRevenueLinked ? "bg-[#05CE78]/20 text-[#05CE78]" : "bg-white/10 text-white"}`}>
                    {m.isRevenueLinked ? "Revenue" : "Guaranteed"}
                  </span>
                </div>
                {showBarPayoutInfo && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-10 flex items-center gap-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider shrink-0">Max of</p>
                    <button onClick={() => setShowBarPayoutInfo(false)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><X className="w-3 h-3 text-gray-500" /></button>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${!m.isRevenueLinked ? "bg-[#05CE78]/25 border border-[#05CE78]/30" : "bg-gray-50 border border-gray-100"}`}>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">1% capital / month</p>
                        <p className={`text-xl font-extrabold ${!m.isRevenueLinked ? "text-[#05CE78]" : "text-gray-400"}`}>{fmt(m.guaranteedMonthlyL)}</p>
                      </div>
                      {!m.isRevenueLinked && <span className="text-xs font-bold text-[#05CE78] bg-[#05CE78]/20 px-2 py-0.5 rounded-full">active</span>}
                    </div>
                    <span className="text-sm text-gray-300 font-bold">vs</span>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${m.isRevenueLinked ? "bg-[#05CE78]/10 border border-[#05CE78]/30" : "bg-gray-50 border border-gray-100"}`}>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">12% of monthly revenue</p>
                        <p className={`text-xl font-extrabold ${m.isRevenueLinked ? "text-[#05CE78]" : "text-gray-400"}`}>{fmt(m.revenueLinkedL)}</p>
                      </div>
                      {m.isRevenueLinked && <span className="text-xs font-bold text-[#05CE78] bg-[#05CE78]/20 px-2 py-0.5 rounded-full">active</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative bg-[#0B1120] rounded-2xl px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Annual Return <span className="text-xs text-gray-500 font-normal normal-case tracking-normal">p.a.</span></p>
                  <button onClick={() => setShowReturnPanel(true)}
                    className="w-7 h-7 rounded-full text-sm font-black flex items-center justify-center transition-all bg-white/15 text-white hover:bg-white/25">i</button>
                </div>
                <span className="text-2xl font-extrabold text-[#05CE78]">{m.annualReturnPct.toFixed(1)}%</span>
              </div>

              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#05CE78] text-white rounded-2xl font-bold text-base shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_20px_rgba(5,206,120,0.3)] transition-all hover:bg-[#04b067] active:scale-95">
                <MessageCircle className="w-5 h-5" />
                Express Interest on WhatsApp
              </a>
            </div>

          </div>
        </div>
      </div>
      {/* end desktop */}

      {/* Desktop Exit Value slide panel */}
      {showDesktopAdvanced && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowDesktopAdvanced(false)} />
          <div className="fixed top-[135px] bottom-[50px] right-0 w-[420px] bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" /> Exit Value &amp; Total Value
              </p>
              <button onClick={() => setShowDesktopAdvanced(false)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 px-6 py-6 space-y-4">
              <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-2xl p-5 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Exit Value</p>
                <p className="text-xs text-gray-400 mb-3">Inventory appreciation at 6% p.a. over 5 yrs</p>
                <p className="text-3xl font-extrabold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Value</p>
                <p className="text-xs text-gray-400 mb-3">All payouts + exit value combined</p>
                <p className="text-3xl font-extrabold text-gray-900">{fmt(m.totalValueL)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Breakdown</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">60-mo payouts</span>
                    <span className="font-bold text-gray-900">{fmt(m.totalPayouts60L)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Exit value</span>
                    <span className="font-bold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-bold text-gray-700">Total</span>
                    <span className="font-extrabold text-gray-900">{fmt(m.totalValueL)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Desktop How Returns Work slide panel */}
      {showDesktopHowReturns && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowDesktopHowReturns(false)} />
          <div className="fixed top-[135px] bottom-[50px] right-0 w-[420px] bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#05CE78]" /> How Returns Work
              </p>
              <button onClick={() => setShowDesktopHowReturns(false)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {[
                { step: "01", title: "MMG Formula", desc: "Monthly Payout = max(1% of total capital, 12% of net revenue). Your payout = your equity % of that pool result." },
                { step: "02", title: "Inventory Appreciation", desc: "70% of total project cost is deployed into jewellery inventory. Your proportional share appreciates at 6% p.a. and is returned at exit." },
                { step: "03", title: "Total Value at Exit", desc: "All monthly payouts received over 60 months plus your inventory value at the end of the 5-year tenure." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-3 bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <span className="text-xs font-black text-gray-300 w-5 shrink-0 mt-0.5">{step}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Desktop Return Breakdown slide panel */}
      {showReturnPanel && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowReturnPanel(false)} />
          <div className="fixed top-[135px] bottom-[50px] right-0 w-[420px] bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#05CE78]" /> Return Breakdown
              </p>
              <button onClick={() => setShowReturnPanel(false)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Monthly Payouts</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {[1, 2].map(mo => (
                  <div key={mo} className="flex justify-between items-center px-4 py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-400 font-mono">M{String(mo).padStart(2, "0")}</span>
                    <span className="text-sm font-semibold text-gray-800">{fmt(m.monthlyPayoutL)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                  <span className="text-sm text-gray-300 font-mono tracking-widest">...</span>
                  <span className="text-xs text-gray-300">56 more months</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-400 font-mono">M60</span>
                  <span className="text-sm font-semibold text-gray-800">{fmt(m.monthlyPayoutL)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 bg-[#05CE78]/5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#05CE78]">M60 · Exit value</span>
                    <button onClick={() => { setShowReturnPanel(false); setShowDesktopAdvanced(true); }}
                      className="w-5 h-5 rounded-full bg-[#05CE78]/20 text-[#05CE78] text-xs font-black flex items-center justify-center hover:bg-[#05CE78]/30 transition-colors">i</button>
                  </div>
                  <span className="text-sm font-bold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total payouts (M1–M60)</span>
                  <span className="font-semibold text-gray-900">{fmt(m.totalPayouts60L)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Exit value</span>
                  <span className="font-semibold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-3">
                  <span className="text-gray-700">Total received</span>
                  <span className="text-gray-900">{fmt(m.totalValueL)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-gray-200 pt-3 text-gray-400 italic">
                  <span>total ÷ investment ÷ 5 yrs</span>
                </div>
                <div className="bg-[#0B1120] rounded-xl px-5 py-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Annual Return</span>
                  <span className="text-2xl font-extrabold text-[#05CE78]">{m.annualReturnPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MOBILE ── */}
      <div className="flex flex-col md:hidden min-h-screen">

        {/* Top bar */}
        <div className="bg-white flex items-center justify-between px-4 py-3 shrink-0 sticky top-0 z-30 border-b border-gray-100">
          <Link href="/opportunities/jewellery/onya-diamonds"
            className="flex items-center gap-1.5 text-gray-400 active:text-white text-sm">
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">Onya Diamonds</span>
          </Link>
          <div className="flex items-center gap-1.5 text-[#05CE78] text-xs font-bold tracking-wider uppercase">
            <BarChart3 className="w-3 h-3" /> Simulator
          </div>
        </div>

        {/* Scrollable content — pb-28 clears the fixed sticky bar */}
        <div className="flex-1 bg-gray-50 pb-28">
          <MobileContent
            totalPoolL={totalPoolL}
            investmentL={investmentL} setInvestmentL={setInvestmentL}
            monthlyRevenueL={monthlyRevenueL} setMonthlyRevenueL={setMonthlyRevenueL}
            m={m} waLink={waLink}
          />
        </div>

        {/* Fixed sticky bar at viewport bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden pb-safe">
          <MobileSticky m={m} investmentL={investmentL} waLink={waLink} />
        </div>
      </div>
    </div>
  );
}

/* ─── MOBILE SCROLLABLE CONTENT ─── */
function MobileContent({
  totalPoolL, investmentL, setInvestmentL, monthlyRevenueL, setMonthlyRevenueL, m, waLink,
}: {
  totalPoolL: number;
  investmentL: number; setInvestmentL: (v: number) => void;
  monthlyRevenueL: number; setMonthlyRevenueL: (v: number) => void;
  m: ReturnType<typeof calcModel>;
  waLink: string;
}) {
  const [editingInvestment, setEditingInvestment] = useState(false);
  const [showExitPanel, setShowExitPanel] = useState(false);
  const [showReturnsPanel, setShowReturnsPanel] = useState(false);
  useEffect(() => {
    document.body.style.overflow = (showExitPanel || showReturnsPanel) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showExitPanel, showReturnsPanel]);

  return (
    <>
    <div className="px-4 pt-4 pb-32 space-y-1 bg-gray-50">

      {/* Row 1: Total Project Cost */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Project Cost</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Inventory <span className="font-semibold text-gray-700">70%</span></span>
            <span>Store <span className="font-semibold text-gray-700">30%</span></span>
          </div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900">₹2 Cr</p>
      </div>

      {/* Row 2: Monthly Revenue Simulator */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Monthly Revenue Simulator</p>
            <p className="text-xs text-gray-500">Adjust expected store revenue</p>
          </div>
          <span className="text-base font-extrabold text-gray-900 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl shrink-0 ml-3">{fmt(monthlyRevenueL)}</span>
        </div>
        <input type="range" min={5} max={100} step={5} value={monthlyRevenueL}
          onChange={e => setMonthlyRevenueL(Number(e.target.value))}
          className="onya-slider" style={sliderStyle(monthlyRevenueL, 5, 100)} />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5"><span>₹5L/mo</span><span>₹1Cr/mo</span></div>
      </div>

      {/* Row 3: Your Investment + Total Payouts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-2xl p-4 relative overflow-hidden">
          <p className="flex items-center gap-1 text-xs font-bold text-[#05CE78] uppercase tracking-wider mb-2">
            <Gem className="w-3 h-3" /> Your Investment
          </p>
          <Gem className="absolute top-3 right-3 w-8 h-8 text-[#05CE78]/10" />
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-extrabold text-gray-900">{fmt(investmentL)}</p>
            <button onClick={() => setEditingInvestment(v => !v)}
              className="flex items-center gap-0.5 text-xs text-[#05CE78] font-bold bg-[#05CE78]/10 px-1.5 py-0.5 rounded-lg">
              <Pencil className="w-2.5 h-2.5" /> {editingInvestment ? "Done" : "Edit"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">{(m.investorShare * 100).toFixed(1)}% share</p>
        </div>
        <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-2xl p-4">
          <p className="text-xs font-bold text-[#05CE78] uppercase tracking-wider mb-2">Total Payouts</p>
          <p className="text-xl font-extrabold text-gray-900">{fmt(m.totalPayouts60L)}</p>
          <p className="text-xs text-gray-400 mt-1">over 5 year tenure</p>
        </div>
      </div>

      {/* Investment slider — shown when editing */}
      {editingInvestment && (
        <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#05CE78] uppercase tracking-wider">Adjust Investment</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-gray-900">{fmt(investmentL)}</span>
              <button onClick={() => setEditingInvestment(false)}
                className="w-6 h-6 rounded-lg bg-[#0B1120] text-white flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <input type="range" min={5} max={totalPoolL} step={5} value={investmentL}
            onChange={e => setInvestmentL(Number(e.target.value))}
            className="onya-slider" style={sliderStyle(investmentL, 5, totalPoolL)} />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>₹5L min</span><span>{fmt(totalPoolL)}</span></div>
        </div>
      )}

      {/* Row 4: Exit Value & Total Value — slide panel trigger */}
      <button onClick={() => setShowExitPanel(true)}
        className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <BarChart3 className="w-4 h-4 text-gray-400" /> Exit Value &amp; Total Value
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
      </button>

      {/* Row 5: How Returns Work — slide panel trigger */}
      <button onClick={() => setShowReturnsPanel(true)}
        className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <Gem className="w-3.5 h-3.5 text-[#05CE78]" /> How Returns Work
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
      </button>

      <p className="text-xs text-gray-400 text-center">* Projections are illustrative. Past performance not indicative of future returns.</p>

    </div>

    {/* Exit Value slide panel */}
    {showExitPanel && (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowExitPanel(false)} />
        <div className="fixed top-24 bottom-32 right-3 w-60 bg-white z-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-gray-400" /> Exit &amp; Total Value
            </p>
            <button onClick={() => setShowExitPanel(false)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Exit Value</p>
              <p className="text-[10px] text-gray-400 mb-1.5">Inventory + 6% p.a. over 5 yrs</p>
              <p className="text-xl font-extrabold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Value</p>
              <p className="text-[10px] text-gray-400 mb-1.5">Payouts + exit value</p>
              <p className="text-xl font-extrabold text-gray-900">{fmt(m.totalValueL)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Breakdown</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">60-mo payouts</span>
                  <span className="font-bold text-gray-900">{fmt(m.totalPayouts60L)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Exit value</span>
                  <span className="font-bold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex justify-between text-xs">
                  <span className="font-bold text-gray-700">Total</span>
                  <span className="font-extrabold text-gray-900">{fmt(m.totalValueL)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
    {/* How Returns Work slide panel */}
    {showReturnsPanel && (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowReturnsPanel(false)} />
        <div className="fixed top-24 bottom-32 right-3 w-60 bg-white z-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Gem className="w-3 h-3 text-[#05CE78]" /> How Returns Work
            </p>
            <button onClick={() => setShowReturnsPanel(false)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {[
              { step: "01", title: "MMG Formula", desc: "max(1% of capital, 12% of revenue) × your equity %" },
              { step: "02", title: "Inventory Exit", desc: "70% of total cost appreciates at 6% p.a. for 5 yrs" },
              { step: "03", title: "Total Value", desc: "All monthly payouts + inventory value at exit" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-2.5 bg-gray-50 rounded-xl border border-gray-100 p-3">
                <span className="text-[10px] font-black text-gray-300 w-4 shrink-0 mt-0.5">{step}</span>
                <div>
                  <p className="text-xs font-bold text-gray-900 mb-0.5">{title}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{desc}</p>
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

/* ─── MOBILE STICKY BOTTOM ─── */
function MobileSticky({ m, investmentL, waLink }: {
  m: ReturnType<typeof calcModel>;
  investmentL: number;
  waLink: string;
}) {
  const [showPayoutInfo, setShowPayoutInfo] = useState(false);
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
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monthly Payout</p>
          <button onClick={() => setShowPayoutInfo(v => !v)}
            className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center transition-all ${showPayoutInfo ? "bg-[#05CE78] text-white shadow-[0_0_10px_rgba(5,206,120,0.5)]" : "bg-white/15 text-white"}`}>i</button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-lg font-extrabold text-[#05CE78]">{fmt(m.monthlyPayoutL)}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.isRevenueLinked ? "bg-[#05CE78]/20 text-[#05CE78]" : "bg-white/10 text-white"}`}>
            {m.isRevenueLinked ? "Revenue" : "Gtd"}
          </span>
        </div>
        {showPayoutInfo && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-100 rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] z-20">
            <button onClick={() => setShowPayoutInfo(false)} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center"><X className="w-2.5 h-2.5 text-gray-500" /></button>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Max of</p>
            <div className="space-y-1.5">
              <div className={`flex items-center justify-between px-2.5 py-2 rounded-xl border ${!m.isRevenueLinked ? "border-[#05CE78]/30 bg-[#05CE78]/10" : "border-gray-100 bg-gray-50"}`}>
                <div>
                  <p className="text-[10px] text-gray-400">1% capital / month</p>
                  <p className={`text-sm font-extrabold ${!m.isRevenueLinked ? "text-[#05CE78]" : "text-gray-400"}`}>{fmt(m.guaranteedMonthlyL)}</p>
                </div>
                {!m.isRevenueLinked && <span className="text-[9px] font-bold text-[#05CE78] bg-[#05CE78]/20 px-1.5 py-0.5 rounded-full">active</span>}
              </div>
              <div className={`flex items-center justify-between px-2.5 py-2 rounded-xl border ${m.isRevenueLinked ? "border-[#05CE78]/30 bg-[#05CE78]/10" : "border-gray-100 bg-gray-50"}`}>
                <div>
                  <p className="text-[10px] text-gray-400">12% of monthly revenue</p>
                  <p className={`text-sm font-extrabold ${m.isRevenueLinked ? "text-[#05CE78]" : "text-gray-400"}`}>{fmt(m.revenueLinkedL)}</p>
                </div>
                {m.isRevenueLinked && <span className="text-[9px] font-bold text-[#05CE78] bg-[#05CE78]/20 px-1.5 py-0.5 rounded-full">active</span>}
              </div>
            </div>
          </div>
        )}
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

    {/* Row 2: Express Interest — appears on scroll */}
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
        <div className="fixed top-22 bottom-28 right-3 w-60 bg-white z-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-[#05CE78]" /> Return Breakdown
            </p>
            <button onClick={() => setShowReturnPanel(false)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 px-3 py-2 overflow-hidden">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Monthly Payouts</p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {[1, 2].map(mo => (
                <div key={mo} className="flex justify-between items-center px-3 py-2.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-mono">M{String(mo).padStart(2, "0")}</span>
                  <span className="text-xs font-semibold text-gray-800">{fmt(m.monthlyPayoutL)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center px-3 py-2 border-b border-gray-50 bg-gray-50/50">
                <span className="text-xs text-gray-300 font-mono tracking-widest">...</span>
                <span className="text-[10px] text-gray-300">56 more months</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2.5 border-b border-gray-100">
                <span className="text-xs text-gray-400 font-mono">M60</span>
                <span className="text-xs font-semibold text-gray-800">{fmt(m.monthlyPayoutL)}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2.5 bg-[#05CE78]/5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#05CE78]">M60 · Exit</span>
                  <button onClick={() => { setShowReturnPanel(false); setShowLocalExitPanel(true); }}
                    className="w-4 h-4 rounded-full bg-[#05CE78]/20 text-[#05CE78] text-[9px] font-black flex items-center justify-center">i</button>
                </div>
                <span className="text-xs font-bold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total payouts (M1–M60)</span>
                <span className="font-semibold text-gray-900">{fmt(m.totalPayouts60L)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Exit value</span>
                <span className="font-semibold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold border-t border-gray-200 pt-2.5">
                <span className="text-gray-700">Total received</span>
                <span className="text-gray-900">{fmt(m.totalValueL)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-gray-200 pt-2.5">
                <span className="text-gray-500">Investment</span>
                <span className="font-semibold text-gray-900">{fmt(investmentL)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 italic">
                <span>total ÷ investment ÷ 5 yrs</span>
              </div>
              <div className="bg-[#0B1120] rounded-xl px-3 py-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Annual Return</span>
                <span className="text-base font-extrabold text-[#05CE78]">{m.annualReturnPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </>
    )}

    {/* Mobile Local Exit Value panel */}
    {showLocalExitPanel && (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowLocalExitPanel(false)} />
        <div className="fixed top-24 bottom-32 right-3 w-60 bg-white z-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-gray-400" /> Exit Value
            </p>
            <button onClick={() => setShowLocalExitPanel(false)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            <div className="bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Exit Value</p>
              <p className="text-[10px] text-gray-400 mb-1.5">Inventory + 6% p.a. over 5 yrs</p>
              <p className="text-xl font-extrabold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Value</p>
              <p className="text-[10px] text-gray-400 mb-1.5">Payouts + exit value</p>
              <p className="text-xl font-extrabold text-gray-900">{fmt(m.totalValueL)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Breakdown</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">60-mo payouts</span>
                  <span className="font-bold text-gray-900">{fmt(m.totalPayouts60L)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Exit value</span>
                  <span className="font-bold text-[#05CE78]">{fmt(m.inventoryAtExitL)}</span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex justify-between text-xs">
                  <span className="font-bold text-gray-700">Total</span>
                  <span className="font-extrabold text-gray-900">{fmt(m.totalValueL)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}
