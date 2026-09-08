"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface ResultCard {
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  dark?: boolean;
  green?: boolean;
}

interface BottomMetric {
  label: string;
  value: string;
}

interface CapexItem {
  item: string;
  amount: number;
}

interface Props {
  totalCapex: number;
  capexBreakdown: CapexItem[];
  investorNote?: string;
  resultCards: ResultCard[];
  bottomMetrics: BottomMetric[];
  children: React.ReactNode; // slider section
  revenueTab: React.ReactNode;
  opexTab: React.ReactNode;
  totalRevenue: number;
  totalOpex: number;
  capexSidebarRows?: { label: string; value: string }[];
}

export default function CalculatorShell({
  totalCapex,
  capexBreakdown,
  investorNote,
  resultCards,
  bottomMetrics,
  children,
  revenueTab,
  opexTab,
  totalRevenue,
  totalOpex,
  capexSidebarRows,
}: Props) {
  const [activeTab, setActiveTab] = useState<"revenue" | "opex">("revenue");
  const [showCapex, setShowCapex] = useState(false);

  return (
    <div className="space-y-12">
      {/* CALCULATOR CARD */}
      <section className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-10">
          {children}

          {/* Result cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {resultCards.map((c, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border relative overflow-hidden
                  ${c.dark ? "bg-gray-900 border-gray-800 shadow-xl" : c.green ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-200"}`}
              >
                {c.badge && (
                  <div className={`absolute top-0 right-0 text-[9px] font-bold px-3 py-1 rounded-bl-lg ${c.dark ? "bg-[#05CE78] text-white" : "bg-gray-200 text-gray-600"}`}>
                    {c.badge}
                  </div>
                )}
                {c.dark && <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#05CE78] blur-2xl opacity-20" />}
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.dark ? "text-gray-400" : "text-gray-400"}`}>
                  {c.label}
                </div>
                <div className={`text-2xl font-bold mb-1 ${c.dark ? "text-[#05CE78] text-3xl font-extrabold" : c.green ? "text-[#05CE78]" : "text-gray-900"}`}>
                  {c.value}
                </div>
                {c.sub && <div className={`text-[10px] ${c.dark ? "text-gray-400" : "text-gray-500"}`}>{c.sub}</div>}
              </div>
            ))}
          </div>

          {/* Bottom metrics */}
          <div className="border-t border-gray-100 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {bottomMetrics.map((m, i) => (
              <div key={i}>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{m.label}</div>
                <div className="text-xl font-bold text-gray-900">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* P&L + CapEx */}
      <section className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("revenue")}
                className={`flex-1 py-5 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === "revenue" ? "text-[#05CE78] border-b-2 border-[#05CE78] bg-green-50/10" : "text-gray-400 hover:text-gray-600"}`}
              >
                Revenue Sources
              </button>
              <button
                onClick={() => setActiveTab("opex")}
                className={`flex-1 py-5 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === "opex" ? "text-red-500 border-b-2 border-red-500 bg-red-50/10" : "text-gray-400 hover:text-gray-600"}`}
              >
                Monthly Expenses
              </button>
            </div>
            <div className="p-8">
              {activeTab === "revenue" ? (
                <div>
                  <div className="flex justify-between items-end mb-6 pb-4 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Total Monthly Revenue</span>
                    <span className="text-3xl font-bold text-[#05CE78]">{formatCurrency(totalRevenue)}</span>
                  </div>
                  {revenueTab}
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-end mb-6 pb-4 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Total Operating Cost</span>
                    <span className="text-3xl font-bold text-red-500">{formatCurrency(totalOpex)}</span>
                  </div>
                  {opexTab}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CapEx sidebar */}
        <div className="lg:col-span-1 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Project Cost</h2>
            <button onClick={() => setShowCapex(true)} className="text-xs font-bold text-[#05CE78] uppercase tracking-wide hover:underline">
              Full Breakdown
            </button>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total CapEx</p>
            <p className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">{formatCurrency(totalCapex)}</p>
            {capexSidebarRows && (
              <div className="text-left bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100 mb-6">
                {capexSidebarRows.map((r, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">{r.label}</span>
                      <span className="font-bold text-gray-900">{r.value}</span>
                    </div>
                    {i < capexSidebarRows.length - 1 && <div className="w-full h-px bg-gray-200/50 mt-4" />}
                  </div>
                ))}
              </div>
            )}
            {investorNote && (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-left">
                <p className="text-blue-900 text-xs font-bold uppercase mb-1">Investor Note</p>
                <p className="text-blue-800 text-xs leading-relaxed">{investorNote}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CapEx modal */}
      {showCapex && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-gray-50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Capital Expenditure Breakdown</h3>
              <button onClick={() => setShowCapex(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
              {capexBreakdown.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <span className="text-gray-600 font-medium">{item.item}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="pt-4 mt-2">
                <div className="flex justify-between items-center bg-[#05CE78]/10 p-4 rounded-xl border border-[#05CE78]/20">
                  <span className="font-bold text-[#05CE78] text-xs uppercase">Total Project Cost</span>
                  <span className="font-extrabold text-[#05CE78] text-lg">{formatCurrency(totalCapex)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
