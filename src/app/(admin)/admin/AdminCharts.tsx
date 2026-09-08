"use client";

import { formatCurrency } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell,
} from "recharts";

export interface MonthlyPayoutPoint {
  month: string;
  total: number;
}

export interface PoolCapitalPoint {
  pool: string;
  total: number;
}

export interface InvestorGrowthPoint {
  month: string;
  count: number;
}

interface Props {
  monthlyPayouts: MonthlyPayoutPoint[];
  poolCapital: PoolCapitalPoint[];
  investorGrowth: InvestorGrowthPoint[];
}

const PALETTE = ["#05CE78", "#3B82F6", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#10B981", "#06B6D4", "#F97316"];

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B1120] text-white text-xs p-3 rounded-xl shadow-xl border border-gray-800">
      <p className="font-bold text-gray-300 mb-1">{label}</p>
      <p className="font-black text-[#05CE78]">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B1120] text-white text-xs p-3 rounded-xl shadow-xl border border-gray-800">
      <p className="font-bold text-gray-300 mb-1">{label}</p>
      <p className="font-black text-[#05CE78]">{payload[0].value} investors</p>
    </div>
  );
}

export default function AdminCharts({ monthlyPayouts, poolCapital, investorGrowth }: Props) {
  const hasPayouts = monthlyPayouts.length > 0;
  const hasPools   = poolCapital.length > 0;
  const hasGrowth  = investorGrowth.length > 0;

  return (
    <div className="space-y-5">

      {/* Monthly Payouts + Pool Capital — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Monthly Payouts */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Monthly Disbursements</h2>
            <p className="text-xs text-gray-400 mt-0.5">Net payouts sent to investors, last 12 months</p>
          </div>
          <div className="p-4">
            {!hasPayouts ? (
              <div className="flex items-center justify-center h-48 text-gray-300 text-xs">No payout data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyPayouts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <YAxis
                    axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    tickFormatter={(v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CurrencyTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="total" fill="#05CE78" radius={[4, 4, 0, 0]} barSize={28} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Capital by Pool */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Capital by Pool</h2>
            <p className="text-xs text-gray-400 mt-0.5">Active AUM concentration across pools</p>
          </div>
          <div className="p-4">
            {!hasPools ? (
              <div className="flex items-center justify-center h-48 text-gray-300 text-xs">No investment data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={poolCapital}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis
                    type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    tickFormatter={(v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category" dataKey="pool" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: "#374151", fontWeight: 600 }} width={90}
                  />
                  <Tooltip content={<CurrencyTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={22} animationDuration={1200}>
                    {poolCapital.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Investor Growth — full width */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Investor Growth</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cumulative investors onboarded over time</p>
          </div>
          <span className="text-xs font-black text-[#05CE78]">
            {investorGrowth[investorGrowth.length - 1]?.count ?? 0} total
          </span>
        </div>
        <div className="p-4">
          {!hasGrowth ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-xs">No investor data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={investorGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#05CE78" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#05CE78" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} allowDecimals={false} />
                <Tooltip content={<CountTooltip />} />
                <Area
                  type="monotone" dataKey="count" stroke="#05CE78" strokeWidth={2.5}
                  fill="url(#growthGradient)" dot={false} animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
