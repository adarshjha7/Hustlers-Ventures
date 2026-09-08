"use client";

import { useState } from "react";
import { Wallet, Users } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import CalculatorShell from "./CalculatorShell";
import type { FinancialModel } from "./types";

export default function HospitalityCalculator({ model }: { model: FinancialModel }) {
  const def = (key: string) => model.sliders.find(s => s.key === key)?.default ?? 0;
  const roomTypes = model.room_types ?? [];

  const [investment, setInvestment] = useState(def("investment") || 1000000);
  const [occupancy, setOccupancy]   = useState(def("occupancy") || 85);

  const totalRevenue = roomTypes.reduce((sum, r) => {
    return sum + r.beds * (occupancy / 100) * r.price_per_bed * 30;
  }, 0);
  const totalOpex      = model.fixed_costs.reduce((s, c) => s + c.amount, 0);
  const netProfit      = totalRevenue - totalOpex;
  const investorPool   = Math.round(netProfit * model.investor_profit_split);
  const equityShare    = investment / model.total_capex;
  const userMonthly    = Math.round(investorPool * equityShare);
  const userAnnual     = userMonthly * 12;
  const total5Y        = userMonthly * (model.tenure_years * 12);
  const annualRoi      = (userAnnual / investment) * 100;

  const investSlider = model.sliders.find(s => s.key === "investment");

  return (
    <CalculatorShell
      totalCapex={model.total_capex}
      capexBreakdown={model.capex_breakdown}
      investorNote={model.investor_note}
      totalRevenue={totalRevenue}
      totalOpex={totalOpex}
      resultCards={[
        { label: "Total Asset Profit", value: formatCurrency(netProfit), sub: "Monthly net income (100%)" },
        { label: "Investor Pool", value: formatCurrency(investorPool), sub: "Distributable amount", badge: `${Math.round(model.investor_profit_split * 100)}% SPLIT`, green: true },
        { label: "Your Monthly Take", value: formatCurrency(userMonthly), sub: `~${(equityShare * 100).toFixed(1)}% ownership share`, dark: true, badge: "YOU" },
      ]}
      bottomMetrics={[
        { label: "Tenure", value: `${model.tenure_years} Years` },
        { label: "5Y Total Returns", value: formatCurrency(total5Y) },
        { label: "Monthly Cashflow", value: formatCurrency(userMonthly) },
        { label: "Annual ROI", value: `${annualRoi.toFixed(1)}%` },
      ]}
      capexSidebarRows={model.capex_breakdown.slice(0, 4).map(c => ({ label: c.item, value: formatCurrency(c.amount) }))}
      revenueTab={
        <div className="space-y-4">
          {roomTypes.map((room, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#05CE78]/30 transition-colors">
              <div>
                <p className="font-bold text-gray-900 text-sm">{room.type}</p>
                <p className="text-xs text-gray-500 mt-1">{room.beds} Beds × {occupancy}% occ.</p>
              </div>
              <p className="font-bold text-gray-900 text-sm">
                ₹{room.price_per_bed}<span className="text-xs text-gray-400 font-normal">/night</span>
              </p>
            </div>
          ))}
        </div>
      }
      opexTab={
        <div className="space-y-4">
          {model.fixed_costs.map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-gray-600">{item.label}</span>
                <span className="text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-gray-800 h-full rounded-full opacity-60"
                  style={{ width: `${Math.min(100, (item.amount / totalOpex) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      }
    >
      <div className="grid md:grid-cols-2 gap-12 mb-12">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-[#05CE78]" /> Investment
            </label>
            <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">{formatCurrency(investment)}</div>
          </div>
          <input type="range" min={investSlider?.min ?? 500000} max={investSlider?.max ?? model.total_capex} step={investSlider?.step ?? 500000}
            value={investment} onChange={e => setInvestment(Number(e.target.value))}
            className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>Min: {formatCurrency(investSlider?.min ?? 500000)}</span>
            <span>Max: {formatCurrency(investSlider?.max ?? model.total_capex)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <Users className="w-4 h-4 text-[#05CE78]" /> Occupancy
            </label>
            <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">{occupancy}%</div>
          </div>
          <input type="range" min={50} max={100} step={5} value={occupancy} onChange={e => setOccupancy(Number(e.target.value))}
            className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-400 font-medium"><span>50% (Base)</span><span>100% (Peak)</span></div>
        </div>
      </div>
    </CalculatorShell>
  );
}
