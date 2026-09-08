"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Calculator, TrendingUp, CalendarClock, Banknote, Info } from "lucide-react";

const RATE_OPTIONS = [12, 14, 15, 16];
const TDS_RATE = 0.10;

function formatINR(val: number) {
  return "₹" + val.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function DebtFundCalculator() {
  const params = useSearchParams();
  const prefilledAmount = Math.max(0, parseInt(params.get("amount") ?? "0", 10));
  const hasAmount = prefilledAmount > 0;
  const initialAmount = prefilledAmount >= 200000 ? prefilledAmount : 200000;

  const [amount, setAmount] = useState(initialAmount);
  const [rate, setRate] = useState(hasAmount ? 12 : 15);
  const [rawInput, setRawInput] = useState(initialAmount.toLocaleString("en-IN"));
  const [showAfterTds, setShowAfterTds] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefilledAmount >= 200000 && sectionRef.current) {
      setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    }
  }, [prefilledAmount]);

  const quarterly = useMemo(() => (amount * rate) / 400, [amount, rate]);
  const annual = useMemo(() => (amount * rate) / 100, [amount, rate]);
  const totalInterest = useMemo(() => annual * 2, [annual]);
  const totalReceived = useMemo(() => amount + totalInterest, [amount, totalInterest]);

  const tds = (val: number) => showAfterTds ? Math.round(val * (1 - TDS_RATE)) : val;
  const valid = amount >= 200000;
  const belowMin = hasAmount && prefilledAmount > 0 && prefilledAmount < 200000;
  const topUpNeeded = belowMin ? 200000 - prefilledAmount : 0;

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = parseInt(raw || "0", 10);
    setAmount(num);
    setRawInput(num === 0 ? "" : num.toLocaleString("en-IN"));
  }

  return (
    <section ref={sectionRef} id="calculator" className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
            <span className="text-[#05CE78] font-bold text-sm uppercase tracking-widest">Returns Calculator</span>
            <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">See Your Projected Payouts</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">
            Enter your investment amount and expected rate to see exactly what lands in your account every quarter.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">

          {/* Top-up nudge — shown when pre-filled amount is below minimum */}
          {belowMin && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Your payout of <span className="font-bold">{formatINR(prefilledAmount)}</span> is below the ₹2,00,000 minimum.
                Top up <span className="font-bold">{formatINR(topUpNeeded)}</span> more to start investing.
              </p>
            </div>
          )}

          {/* Input card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-8 space-y-6">

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Investment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rawInput}
                    onChange={handleAmountChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent"
                    placeholder="2,00,000"
                  />
                </div>
                {amount > 0 && amount < 200000 && (
                  <p className="text-xs text-amber-600 font-medium mt-1.5">Minimum investment is ₹2,00,000</p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[200000, 500000, 1000000, 2500000, 5000000].map(p => (
                    <button
                      key={p}
                      onClick={() => { setAmount(p); setRawInput(p.toLocaleString("en-IN")); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${amount === p ? "bg-[#05CE78] text-white border-[#05CE78]" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-[#05CE78] hover:text-[#05CE78]"}`}
                    >
                      {formatINR(p)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Interest Rate (p.a.)
                </label>
                <div className="flex gap-3">
                  {RATE_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRate(r)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${rate === r ? "bg-[#05CE78] text-white border-[#05CE78]" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#05CE78] hover:text-[#05CE78]"}`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Actual rate determined at subscription based on investment size.</p>
              </div>
            </div>

            {/* Summary tiles */}
            <div className="bg-[#0B1120] p-8">
              {/* TDS toggle */}
              <div className="flex items-center justify-end gap-2 mb-5">
                <span className="text-xs text-gray-400 font-medium">After TDS (10%)</span>
                <button
                  onClick={() => setShowAfterTds(v => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${showAfterTds ? "bg-[#05CE78]" : "bg-white/20"}`}
                  aria-label="Toggle TDS"
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showAfterTds ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <CalendarClock className="w-5 h-5 text-[#05CE78] mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Quarterly Payout</p>
                  <p className="text-xl font-extrabold text-[#05CE78]">{valid ? formatINR(tds(quarterly)) : "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">every 3 months</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <TrendingUp className="w-5 h-5 text-[#05CE78] mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Annual Payout</p>
                  <p className="text-xl font-extrabold text-white">{valid ? formatINR(tds(annual)) : "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">per year</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <Banknote className="w-5 h-5 text-[#05CE78] mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Interest</p>
                  <p className="text-xl font-extrabold text-white">{valid ? formatINR(tds(totalInterest)) : "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">over 24 months</p>
                </div>
                <div className="bg-[#05CE78]/10 rounded-2xl p-4 border border-[#05CE78]/30 text-center">
                  <Calculator className="w-5 h-5 text-[#05CE78] mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Received</p>
                  <p className="text-xl font-extrabold text-[#05CE78]">{valid ? formatINR(showAfterTds ? amount + tds(totalInterest) : totalReceived) : "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">principal + interest</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 text-center mt-5">
                {showAfterTds
                  ? "Showing post-TDS amounts. TDS at 10% is deducted on interest payouts as required by Indian income tax law."
                  : "Indicative projections only. Toggle above to see amounts after 10% TDS deduction."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
