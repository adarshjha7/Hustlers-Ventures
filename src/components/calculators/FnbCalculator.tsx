"use client";

import { useState } from "react";
import { Wallet, Bus, Users, Utensils, Car } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import CalculatorShell from "./CalculatorShell";
import type { FinancialModel } from "./types";

export default function FnbCalculator({ model }: { model: FinancialModel }) {
  const def = (key: string) => model.sliders.find(s => s.key === key)?.default ?? 0;

  const [investment, setInvestment]         = useState(def("investment") || 500000);
  const [busCount, setBusCount]             = useState(def("bus_count") || 20);
  const [paxPerBus, setPaxPerBus]           = useState(def("pax_per_bus") || 15);
  const [avgBillValue, setAvgBillValue]     = useState(def("avg_bill_value") || 200);
  const [dailyCarRevenue, setDailyCarRevenue] = useState(def("daily_car_revenue") || 20000);

  const foodCostPct       = model.food_cost_pct ?? 0.40;
  const driverCostPerBus  = model.driver_cost_per_bus ?? 700;

  const dailyBusGross     = busCount * paxPerBus * avgBillValue;
  const totalDailyGross   = dailyBusGross + dailyCarRevenue;
  const dailyDriverCost   = busCount * driverCostPerBus;
  const netDailyRevenue   = totalDailyGross - dailyDriverCost;
  const netMonthlyRevenue = netDailyRevenue * 30;
  const rawMaterialCost   = Math.round(netMonthlyRevenue * foodCostPct);
  const fixedOpex         = model.fixed_costs.reduce((s, c) => s + c.amount, 0);
  const totalOpex         = fixedOpex + rawMaterialCost;
  const netMonthlyProfit  = netMonthlyRevenue - totalOpex;
  const investorPool      = Math.round(netMonthlyProfit * model.investor_profit_split);

  const equityShare   = investment / model.total_capex;
  const userMonthly   = Math.round(investorPool * equityShare);
  const userAnnual    = userMonthly * 12;
  const total5Y       = userMonthly * (model.tenure_years * 12);
  const annualRoi     = (userAnnual / investment) * 100;

  const investSlider = model.sliders.find(s => s.key === "investment");

  return (
    <CalculatorShell
      totalCapex={model.total_capex}
      capexBreakdown={model.capex_breakdown}
      investorNote={model.investor_note}
      totalRevenue={netMonthlyRevenue}
      totalOpex={totalOpex}
      resultCards={[
        { label: "Total Asset Profit", value: formatCurrency(netMonthlyProfit), sub: "Monthly net income (100%)" },
        { label: "Investor Pool", value: formatCurrency(investorPool), sub: "Distributable amount", badge: `${Math.round(model.investor_profit_split * 100)}% SPLIT`, green: true },
        { label: "Your Monthly Take", value: formatCurrency(userMonthly), sub: `~${(equityShare * 100).toFixed(2)}% ownership share`, dark: true, badge: "YOU" },
      ]}
      bottomMetrics={[
        { label: "Tenure", value: `${model.tenure_years} Years` },
        { label: "5Y Total Returns", value: formatCurrency(total5Y) },
        { label: "Monthly Cashflow", value: formatCurrency(userMonthly) },
        { label: "Annual ROI", value: `${annualRoi.toFixed(1)}%` },
      ]}
      capexSidebarRows={model.capex_breakdown.slice(0, 4).map(c => ({ label: c.item.split("(")[0].trim(), value: formatCurrency(c.amount) }))}
      revenueTab={
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-900 text-sm">Total Gross Sales</p>
              <p className="text-xs text-gray-500 mt-1">From Buses & Cars</p>
            </div>
            <p className="font-bold text-gray-900 text-sm">{formatCurrency(totalDailyGross * 30)}</p>
          </div>
          <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
            <div>
              <p className="font-bold text-red-900 text-sm">Less: Driver Incentives</p>
              <p className="text-xs text-red-500 mt-1">₹{driverCostPerBus} per bus per halt</p>
            </div>
            <p className="font-bold text-red-700 text-sm">-{formatCurrency(dailyDriverCost * 30)}</p>
          </div>
          <p className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded-lg border border-gray-100">
            *Net Revenue is used as the base for calculating Food Cost ({Math.round(foodCostPct * 100)}%).
          </p>
        </div>
      }
      opexTab={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold uppercase">
              <span className="text-gray-700">Raw Materials ({Math.round(foodCostPct * 100)}%)</span>
              <span className="text-gray-900">{formatCurrency(rawMaterialCost)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-red-400 h-full rounded-full" style={{ width: `${Math.round(foodCostPct * 100)}%` }} />
            </div>
          </div>
          {model.fixed_costs.map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-gray-600">{item.label}</span>
                <span className="text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-gray-800 h-full rounded-full opacity-60" style={{ width: `${Math.min(100, (item.amount / totalOpex) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      }
    >
      <div className="mb-10 p-8 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex justify-between items-end mb-6">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-[#05CE78]" /> Investment Amount
          </label>
          <div className="text-3xl font-extrabold text-gray-900 bg-white px-5 py-2 rounded-xl border border-gray-200 shadow-sm">{formatCurrency(investment)}</div>
        </div>
        <input type="range" min={investSlider?.min ?? 500000} max={investSlider?.max ?? model.total_capex} step={investSlider?.step ?? 500000}
          value={investment} onChange={e => setInvestment(Number(e.target.value))}
          className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        <div className="flex justify-between text-xs text-gray-400 font-medium mt-3">
          <span>Min: {formatCurrency(investSlider?.min ?? 500000)}</span>
          <span>Max: {formatCurrency(investSlider?.max ?? model.total_capex)}</span>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
        Monthly Average Assumptions
      </h3>

      <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
        {[
          { label: "Daily Buses", icon: Bus, key: "busCount", value: busCount, set: setBusCount, min: 10, max: 80, step: 1, fmt: (v: number) => String(v) },
          { label: "Pax per Bus", icon: Users, key: "paxPerBus", value: paxPerBus, set: setPaxPerBus, min: 5, max: 40, step: 1, fmt: (v: number) => String(v) },
          { label: "Bill Value / Head", icon: Utensils, key: "avgBillValue", value: avgBillValue, set: setAvgBillValue, min: 100, step: 10, max: 500, fmt: (v: number) => `₹${v}` },
          { label: "Daily Pvt Revenue", icon: Car, key: "dailyCarRevenue", value: dailyCarRevenue, set: setDailyCarRevenue, min: 5000, max: 50000, step: 1000, fmt: (v: number) => formatCurrency(v) },
        ].map(({ label, icon: Icon, key, value, set, min, max, step, fmt }) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Icon className="w-4 h-4" /> {label}
              </label>
              <span className="font-bold text-lg text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{fmt(value)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(Number(e.target.value))}
              className="w-full accent-gray-900 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          </div>
        ))}
      </div>
    </CalculatorShell>
  );
}
