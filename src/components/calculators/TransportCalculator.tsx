"use client";

import { useState } from "react";
import { Wallet, Ticket, Bus, Fuel } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import CalculatorShell from "./CalculatorShell";
import type { FinancialModel } from "./types";

export default function TransportCalculator({ model }: { model: FinancialModel }) {
  const totalEquity = model.total_capex * (1 - (model.debt_ratio ?? 0.75));
  const totalDebt   = model.total_capex * (model.debt_ratio ?? 0.75);
  const monthlyEmi  = model.monthly_emi ?? 0;

  // Find slider defaults
  const def = (key: string) => model.sliders.find(s => s.key === key)?.default ?? 0;

  const [investment, setInvestment]     = useState(def("investment") || 1000000);
  const [occupancy, setOccupancy]       = useState(def("occupancy") || 85);
  const [ticketPrice, setTicketPrice]   = useState(def("ticket_price") || 1050);
  const [dieselPrice, setDieselPrice]   = useState(def("diesel_price") || 95);

  // Constants derived from model
  const totalBuses   = model.sliders.find(s => s.key === "total_buses")?.default ?? 8;
  const seatsPerBus  = model.sliders.find(s => s.key === "seats_per_bus")?.default ?? 40;
  const dailyKm      = model.sliders.find(s => s.key === "daily_km")?.default ?? 750;
  const mileage      = model.sliders.find(s => s.key === "mileage")?.default ?? 4;
  const commissionPct = model.sliders.find(s => s.key === "commission_pct")?.default ?? 12;

  const cargoPerBus  = 2000;
  const tollsPerBus  = 3000;

  const monthlyRevenue = Math.round(
    totalBuses * seatsPerBus * (occupancy / 100) * ticketPrice * 30 +
    totalBuses * cargoPerBus * 30
  );
  const fuelCost    = Math.round((totalBuses * dailyKm / mileage) * dieselPrice * 30);
  const tollsCost   = totalBuses * tollsPerBus * 30;
  const fixedCost   = model.fixed_costs.reduce((s, c) => s + c.amount, 0);
  const commission  = Math.round(monthlyRevenue * (commissionPct / 100));
  const totalOpex   = fuelCost + tollsCost + fixedCost + commission + monthlyEmi;

  const netProfit   = monthlyRevenue - totalOpex;
  const investorPool = Math.round(netProfit * model.investor_profit_split);
  const equityShare  = investment / totalEquity;
  const userMonthly  = Math.round(investorPool * equityShare);

  // Exit
  const resalePct    = model.resale_pct ?? 0.3;
  const gainShare    = model.capital_gain_share ?? 0.4;
  const resaleValue  = model.total_capex * resalePct;
  const capitalGain  = resaleValue - totalEquity;
  const investorGain = capitalGain > 0 ? capitalGain * gainShare : 0;
  const userExit     = Math.round((totalEquity + investorGain) * equityShare);
  const totalOps5Y   = userMonthly * (model.tenure_years * 12);
  const totalReturn  = totalOps5Y + userExit;
  const annualRoi    = (((totalReturn - investment) / model.tenure_years) / investment) * 100;

  const investSlider = model.sliders.find(s => s.key === "investment");

  return (
    <CalculatorShell
      totalCapex={model.total_capex}
      capexBreakdown={model.capex_breakdown}
      investorNote={model.investor_note}
      totalRevenue={monthlyRevenue}
      totalOpex={totalOpex}
      resultCards={[
        { label: "Monthly Payout", value: formatCurrency(userMonthly), sub: `Your share (${Math.round(model.investor_profit_split * 100)}% split)` },
        { label: "Total Investor Pool", value: formatCurrency(investorPool), sub: "Total distributable to pool", badge: `${Math.round(model.investor_profit_split * 100)}% SPLIT`, green: true },
        { label: "Lifetime Return (5Y)", value: formatCurrency(totalReturn), sub: "Cashflow + exit proceeds", dark: true, badge: "TOTAL" },
      ]}
      bottomMetrics={[
        { label: "Tenure", value: `${model.tenure_years} Years` },
        { label: "Profit Share", value: `${(equityShare * 100).toFixed(2)}%` },
        { label: "Total Multiplier", value: `${(totalReturn / investment).toFixed(1)}x` },
        { label: "Annual ROI (IRR)", value: `${annualRoi.toFixed(1)}%` },
      ]}
      capexSidebarRows={[
        { label: `Bank Debt (${Math.round((model.debt_ratio ?? 0.75) * 100)}%)`, value: formatCurrency(totalDebt) },
        { label: `Equity Pool (${Math.round((1 - (model.debt_ratio ?? 0.75)) * 100)}%)`, value: formatCurrency(totalEquity) },
      ]}
      revenueTab={
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-900 text-sm">Passenger Sales</p>
              <p className="text-xs text-gray-500 mt-1">{totalBuses} Buses ({seatsPerBus} Seats) × {occupancy}%</p>
            </div>
            <p className="font-bold text-gray-900 text-sm">{formatCurrency(monthlyRevenue - totalBuses * cargoPerBus * 30)}</p>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-900 text-sm">Cargo Revenue</p>
              <p className="text-xs text-gray-500 mt-1">Parcel & Logistics (Fixed)</p>
            </div>
            <p className="font-bold text-gray-900 text-sm">{formatCurrency(totalBuses * cargoPerBus * 30)}</p>
          </div>
        </div>
      }
      opexTab={
        <div className="space-y-3">
          {[
            { label: "Fuel (Diesel)", amount: fuelCost },
            { label: "Bank EMI (Debt)", amount: monthlyEmi },
            { label: "Tolls", amount: tollsCost },
            { label: "Commission", amount: commission },
            ...model.fixed_costs,
          ].map((item, i) => (
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
      <div className="grid md:grid-cols-2 gap-12 mb-12">
        {/* Investment slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-[#05CE78]" /> Investment (Equity)
            </label>
            <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">{formatCurrency(investment)}</div>
          </div>
          <input type="range" min={investSlider?.min ?? 500000} max={investSlider?.max ?? totalEquity} step={investSlider?.step ?? 500000}
            value={investment} onChange={e => setInvestment(Number(e.target.value))}
            className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>Min: {formatCurrency(investSlider?.min ?? 500000)}</span>
            <span>Max: {formatCurrency(investSlider?.max ?? totalEquity)}</span>
          </div>
        </div>

        {/* Ticket price slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <Ticket className="w-4 h-4 text-[#05CE78]" /> Avg Ticket Price
            </label>
            <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">{formatCurrency(ticketPrice)}</div>
          </div>
          <input type="range" min={800} max={2500} step={50} value={ticketPrice} onChange={e => setTicketPrice(Number(e.target.value))}
            className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-400 font-medium"><span>₹800 (Seater)</span><span>₹2500 (Premium)</span></div>
        </div>

        {/* Occupancy */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <Bus className="w-4 h-4 text-[#05CE78]" /> Occupancy
            </label>
            <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">{occupancy}%</div>
          </div>
          <input type="range" min={50} max={100} step={5} value={occupancy} onChange={e => setOccupancy(Number(e.target.value))}
            className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-400 font-medium"><span>50% (Low)</span><span>100% (Full)</span></div>
        </div>

        {/* Diesel */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <Fuel className="w-4 h-4 text-[#05CE78]" /> Diesel Price (₹/L)
            </label>
            <div className="text-2xl font-bold text-gray-900 bg-gray-50 px-4 py-1 rounded-lg border border-gray-100">₹{dieselPrice}</div>
          </div>
          <input type="range" min={80} max={130} step={1} value={dieselPrice} onChange={e => setDieselPrice(Number(e.target.value))}
            className="w-full accent-[#05CE78] h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-400 font-medium"><span>₹80</span><span>₹130</span></div>
        </div>
      </div>
    </CalculatorShell>
  );
}
