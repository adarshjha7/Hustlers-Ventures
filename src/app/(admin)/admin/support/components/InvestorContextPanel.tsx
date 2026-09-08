"use client";

import { formatCurrency } from "@/lib/formatters";

export interface InvestorContext {
  name: string;
  email: string;
  phone: string | null;
  totalInvested: number;
  activePools: number;
}

export default function InvestorContextPanel({ context }: { context: InvestorContext }) {
  const initials = context.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="w-[280px] shrink-0 border-l border-gray-200 bg-gray-50 p-4 space-y-4 overflow-y-auto hidden lg:block">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Investor Context</p>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#05CE78]/15 text-[#05CE78] flex items-center justify-center font-black text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{context.name}</p>
            <p className="text-xs text-gray-500 truncate">{context.email}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-semibold">Total Invested</span>
            <span className="font-black text-gray-900">{formatCurrency(context.totalInvested)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-semibold">Active Pools</span>
            <span className="font-black text-gray-900">{context.activePools} {context.activePools === 1 ? "Pool" : "Pools"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-semibold">Phone</span>
            <span className="font-mono text-gray-700">{context.phone ?? "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
