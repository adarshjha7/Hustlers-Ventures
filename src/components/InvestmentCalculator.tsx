"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Info } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const AMOUNT_SLABS = [
  { label: "₹5L", value: 500000 },
  { label: "₹10L", value: 1000000 },
  { label: "₹25L", value: 2500000 },
  { label: "₹50L", value: 5000000 },
];

export default function InvestmentCalculator() {
  const router = useRouter();
  const [amount, setAmount] = useState(2500000);
  const [rate, setRate] = useState(23);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const yearlyReturn = amount * (rate / 100);
  const monthlyReturn = yearlyReturn / 12;

  const handleCustomChange = (raw: string) => {
    setCustomInput(raw);
    const parsed = Number(raw.replace(/[^0-9]/g, ""));
    if (parsed >= 500000) setAmount(parsed);
  };

  return (
    <div className="bg-[#0B1120] rounded-2xl p-6 text-white relative overflow-hidden shadow-xl border border-gray-800 flex flex-col gap-6">

      {/* Amount Slabs */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">If I invest</label>
          <span className="text-2xl font-extrabold text-white">{formatCurrency(amount)}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {AMOUNT_SLABS.map((slab) => (
            <button
              key={slab.value}
              type="button"
              onClick={() => { setIsCustom(false); setAmount(slab.value); }}
              className={`py-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                !isCustom && amount === slab.value
                  ? "bg-[#05CE78] border-[#05CE78] text-[#0B1120]"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              {slab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`py-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              isCustom
                ? "bg-[#05CE78] border-[#05CE78] text-[#0B1120]"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            Other
          </button>
        </div>
        {isCustom && (
          <div className="mt-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter amount (min ₹5L)"
              value={customInput}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#05CE78]"
            />
          </div>
        )}
      </div>

      {/* Rate Slider */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">At profit rate</label>
          <span className="text-2xl font-extrabold text-[#05CE78]">{rate}% p.a.</span>
        </div>
        <input
          type="range"
          min="1"
          max="75"
          step="1"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#05CE78]"
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 font-medium">
          <span>1%</span>
          <span>75%</span>
        </div>
      </div>

      {/* Output */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Monthly Return</p>
          <p className="text-xl font-extrabold text-[#05CE78]">{formatCurrency(monthlyReturn)}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Yearly Return</p>
          <p className="text-xl font-extrabold text-blue-400">{formatCurrency(yearlyReturn)}</p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push('/opportunities')}
        className="w-full py-3 bg-[#05CE78] hover:bg-[#04b86c] text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
        style={{ boxShadow: "0 0 0 1px rgba(5,206,120,0.3), 0 0 40px rgba(5,206,120,0.45), 0 0 80px rgba(5,206,120,0.2)" }}
      >
        Start Investing <TrendingUp className="w-4 h-4" />
      </button>

      {/* Disclaimer */}
      <div className="flex gap-2 text-[10px] text-gray-500 leading-relaxed border-t border-white/10 pt-4">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <p>Hustlers Ventures historically delivers 21-27% p.a. Actual returns vary. Not a guarantee.</p>
      </div>
    </div>
  );
}
