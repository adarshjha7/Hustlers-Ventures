"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/formatters";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import {
  Sparkles, TrendingUp, Activity, RefreshCcw,
  Loader2, AlertCircle, Info, ArrowUpRight, Zap, Users,
  Gift, CheckCircle, Banknote,
} from "lucide-react";

// ─── INTERFACES ──────────────────────────────────────────────────────────────

interface PayoutRow {
  investment_id: string;
  gross_roi_amount: number;
  net_payable_amount: number;
  payment_date: string;
  months_considered: number;
}

interface InvestmentRow {
  investment_id: string;
  total_amount: number;
  company_name: string | null;
  created_at: string;
  company_pools: { pool_name: string } | null;
}

interface TransactionRow {
  investment_id: string;
  investment_amount: number;
  transaction_type: string;
  created_at: string;
}

interface ConsistencyResult {
  mean: number;
  stdDev: number;
  score: "Low" | "Medium" | "High";
  payoutCount: number;
}

type Horizon = "1Y" | "3Y" | "5Y" | "10Y";

interface DiversificationData {
  hasEnoughData: boolean;
  totalInvestors?: number;
  diversifiedPct?: number;
  within6mPct?: number;
  avgAssets?: number;
  diversifiedCount?: number;
}

const HORIZON_YEARS: Record<Horizon, number> = { "1Y": 1, "3Y": 3, "5Y": 5, "10Y": 10 };

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function computeConsistency(
  payouts: PayoutRow[],
  totalAmount: number,
): ConsistencyResult | null {
  if (payouts.length < 2 || totalAmount === 0) return null;
  const irrValues = payouts.map(p =>
    (p.gross_roi_amount / totalAmount) * (12 / (p.months_considered || 3)) * 100
  );
  const mean = irrValues.reduce((s, v) => s + v, 0) / irrValues.length;
  const variance = irrValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / irrValues.length;
  const stdDev = Math.sqrt(variance);
  const score: "Low" | "Medium" | "High" = stdDev < 2 ? "Low" : stdDev < 5 ? "Medium" : "High";
  return { mean, stdDev, score, payoutCount: payouts.length };
}

const DEBT_FUND_RATE = 0.14; // Debt Fund Series 1 midpoint (14%)

function buildSimulatorData(capital: number, annualIrr: number, years: number) {
  const quarters = years * 4;
  const quarterlyIrr = annualIrr / 100 / 4;
  const annualPayout = capital * (annualIrr / 100);
  const quarterlyPayout = annualPayout / 4;
  const quarterlyDebtRate = DEBT_FUND_RATE / 4;
  const data: { label: string; simple: number; compound: number; debt: number }[] = [];
  for (let q = 0; q <= quarters; q++) {
    const label = q === 0 ? "Start" : `Y${Math.ceil(q / 4)}Q${((q - 1) % 4) + 1}`;
    data.push({
      label,
      simple: Math.round(capital + q * quarterlyPayout),
      compound: Math.round(capital * Math.pow(1 + quarterlyIrr, q)),
      debt: Math.round(capital * Math.pow(1 + quarterlyDebtRate, q)),
    });
  }
  return data;
}

const CONSISTENCY_STYLES: Record<string, { badge: string; bar: string; text: string }> = {
  Low:    { badge: "bg-emerald-50 text-emerald-700 border-emerald-200",  bar: "bg-emerald-400", text: "text-emerald-600" },
  Medium: { badge: "bg-amber-50 text-amber-700 border-amber-200",        bar: "bg-amber-400",   text: "text-amber-600" },
  High:   { badge: "bg-red-50 text-red-700 border-red-200",              bar: "bg-red-400",     text: "text-red-600" },
};

const CONSISTENCY_LABELS: Record<string, string> = {
  Low:    "Highly Consistent",
  Medium: "Moderate Variance",
  High:   "High Variance",
};

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────

interface TooltipPayloadEntry { dataKey: string; value: number }
function SimulatorTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const simple   = payload.find((p) => p.dataKey === "simple");
  const compound = payload.find((p) => p.dataKey === "compound");
  const debt     = payload.find((p) => p.dataKey === "debt");
  if (!simple || !compound) return null;
  const bonus = compound.value - simple.value;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[200px]">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
        <span className="text-gray-500">Simple:</span>
        <span className="font-bold text-gray-900 ml-auto">{formatCurrency(simple.value)}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-[#05CE78] shrink-0" />
        <span className="text-gray-500">Compounded:</span>
        <span className="font-bold text-gray-900 ml-auto">{formatCurrency(compound.value)}</span>
      </div>
      {debt && (
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
          <span className="text-gray-500">Debt Fund (14%):</span>
          <span className="font-bold text-gray-900 ml-auto">{formatCurrency(debt.value)}</span>
        </div>
      )}
      {bonus > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
          <span className="text-emerald-600 font-bold">+{formatCurrency(bonus)}</span>
          <span className="text-gray-400">compounding bonus</span>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [investments, setInvestments] = useState<InvestmentRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [diversification, setDiversification] = useState<DiversificationData | null>(null);
  const [referralRegistered, setReferralRegistered] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [horizon, setHorizon] = useState<Horizon>("3Y");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: invData, error: invErr } = await supabase
          .from("investor_investments")
          .select("investment_id, total_amount, company_name, created_at, company_pools(pool_name)")
          .eq("user_id", user.id);
        if (invErr) throw invErr;
        if (!invData?.length) {
          if (!cancelled) { setInvestments([]); setLoading(false); }
          return;
        }

        const ids = invData.map(i => i.investment_id);
        const [payoutRes, txRes, divRes, referralRes] = await Promise.all([
          supabase
            .from("investor_quarterly_payments")
            .select("investment_id, gross_roi_amount, net_payable_amount, payment_date, months_considered")
            .in("investment_id", ids),
          supabase
            .from("investor_transactions")
            .select("investment_id, investment_amount, transaction_type, created_at")
            .in("investment_id", ids)
            .eq("transaction_type", "add"),
          fetch("/api/insights/diversification").then(r => r.ok ? r.json() : null),
          fetch("/api/referral/interest").then(r => r.ok ? r.json() : null),
        ]);
        if (payoutRes.error) throw payoutRes.error;
        if (!cancelled) {
          setInvestments(invData as unknown as InvestmentRow[]);
          setPayouts(payoutRes.data || []);
          setTransactions(txRes.data || []);
          setDiversification(divRes as DiversificationData | null);
          if (referralRes?.registered) setReferralRegistered(true);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Failed to load insights.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [retryCount]);

  // ── Derived metrics ───────────────────────────────────────────────────────
  const totalInvested = useMemo(
    () => investments.reduce((s, i) => s + i.total_amount, 0),
    [investments]
  );

  const avgAnnualIrr = useMemo(() => {
    if (!payouts.length || totalInvested === 0) return 22; // fallback to benchmark
    const weightedSum = payouts.reduce(
      (s, p) => s + (p.gross_roi_amount / totalInvested) * (12 / (p.months_considered || 3)) * 100,
      0
    );
    return payouts.length > 0 ? weightedSum / payouts.length : 22;
  }, [payouts, totalInvested]);

  const simulatorData = useMemo(
    () => buildSimulatorData(
      totalInvested > 0 ? totalInvested : 1000000,
      avgAnnualIrr,
      HORIZON_YEARS[horizon]
    ),
    [totalInvested, avgAnnualIrr, horizon]
  );

  const compoundingBonus = useMemo(() => {
    if (!simulatorData.length) return 0;
    const last = simulatorData[simulatorData.length - 1];
    return last.compound - last.simple;
  }, [simulatorData]);

  // Per-asset consistency scores
  const consistencyData = useMemo(() => {
    return investments.map(inv => {
      const invPayouts = payouts.filter(p => p.investment_id === inv.investment_id);
      const assetName = inv.company_name || inv.company_pools?.pool_name || "Asset";
      const consistency = computeConsistency(invPayouts, inv.total_amount);
      return { inv, assetName, consistency, payoutCount: invPayouts.length };
    });
  }, [investments, payouts]);

  // Reinvestment behaviour
  const reinvestmentStats = useMemo(() => {
    const totalNetPayouts = payouts.reduce((s, p) => s + p.net_payable_amount, 0);
    const capitalAdds = transactions.reduce((s, t) => s + t.investment_amount, 0);
    const reinvestedEstimate = Math.min(capitalAdds, totalNetPayouts);
    const reinvestPct = totalNetPayouts > 0 ? (reinvestedEstimate / totalNetPayouts) * 100 : 0;
    const unreinvested = totalNetPayouts - reinvestedEstimate;
    return { totalNetPayouts, capitalAdds, reinvestedEstimate, reinvestPct, unreinvested };
  }, [payouts, transactions]);

  const handleReferralSignup = async () => {
    if (referralRegistered || referralLoading) return;
    setReferralLoading(true);
    try {
      const res = await fetch("/api/referral/interest", { method: "POST" });
      if (res.ok) setReferralRegistered(true);
    } finally {
      setReferralLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-56 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-gray-500 text-sm">{error}</p>
        <button
          onClick={() => setRetryCount(c => c + 1)}
          className="px-4 py-2 bg-[#05CE78] text-black font-bold rounded-lg text-sm hover:bg-[#04b86c] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!investments.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Sparkles className="w-8 h-8 text-gray-300" />
        <p className="text-gray-500 text-sm">No investment data to analyse yet.</p>
      </div>
    );
  }

  const horizons: Horizon[] = ["1Y", "3Y", "5Y", "10Y"];
  const finalSimple   = simulatorData[simulatorData.length - 1]?.simple   ?? 0;
  const finalCompound = simulatorData[simulatorData.length - 1]?.compound ?? 0;
  const finalDebt     = simulatorData[simulatorData.length - 1]?.debt     ?? 0;
  const myAssetCount  = investments.length;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#05CE78]/10 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#05CE78]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Insights</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analyse your portfolio performance and growth potential</p>
        </div>
      </div>

      {/* ── Section 1: Compound Growth Simulator ─────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="h-1 bg-[#05CE78]" />
        <div className="p-6">

          {/* Header */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-[#05CE78]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Compound Growth Simulator</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Simulates reinvesting every payout at {avgAnnualIrr.toFixed(1)}% CAGR
                </p>
              </div>
            </div>
            {/* Horizon Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {horizons.map(h => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    horizon === h
                      ? "bg-[#0B1120] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Starting Capital</p>
              <p className="text-base font-black text-gray-900">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg. CAGR</p>
              <p className="text-base font-black text-[#05CE78]">{avgAnnualIrr.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Simple ({horizon})</p>
              <p className="text-base font-black text-gray-900">{formatCurrency(finalSimple)}</p>
              {totalInvested > 0 && (
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  +{(((finalSimple - totalInvested) / totalInvested) * 100).toFixed(1)}% total return
                </p>
              )}
            </div>
            <div className="bg-[#05CE78]/5 rounded-xl p-3 border border-[#05CE78]/20">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Compounded ({horizon})</p>
              <p className="text-base font-black text-[#05CE78]">{formatCurrency(finalCompound)}</p>
              {totalInvested > 0 && (
                <p className="text-xs text-[#05CE78]/70 mt-0.5 font-medium">
                  +{(((finalCompound - totalInvested) / totalInvested) * 100).toFixed(1)}% total return
                </p>
              )}
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={simulatorData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip content={<SimulatorTooltip />} />
              <Line
                type="monotone"
                dataKey="simple"
                stroke="#94A3B8"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 4"
                name="Simple Growth"
              />
              <Line
                type="monotone"
                dataKey="compound"
                stroke="#05CE78"
                strokeWidth={2.5}
                dot={false}
                name="Compounded Growth"
              />
              <Line
                type="monotone"
                dataKey="debt"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 3"
                name="Debt Fund (14%)"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Chart legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3 mb-1">
            <div className="flex items-center gap-1.5">
              <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5 4" /></svg>
              <span className="text-xs text-gray-500">Simple</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#05CE78" strokeWidth="2.5" /></svg>
              <span className="text-xs text-gray-500">Compounded ({avgAnnualIrr.toFixed(1)}% CAGR)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 3" /></svg>
              <span className="text-xs text-gray-500">Debt Fund Series 1 (14%)</span>
            </div>
          </div>

          {/* Compounding bonus callout */}
          {compoundingBonus > 0 && (
            <div className="mt-4 flex items-center gap-3 bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-xl px-4 py-3">
              <Zap className="w-4 h-4 text-[#05CE78] shrink-0" />
              <p className="text-sm font-medium text-gray-700">
                By reinvesting every payout, you gain an extra{" "}
                <span className="font-bold text-[#05CE78]">{formatCurrency(compoundingBonus)}</span>{" "}
                over {horizon}. That&#39;s the compounding advantage.
              </p>
            </div>
          )}

          {/* Debt fund comparison row */}
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Banknote className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Debt Fund Series 1 (14% fixed)</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap sm:ml-auto">
              <div className="text-center">
                <p className="text-xs text-amber-600 font-semibold">Compounded over {horizon}</p>
                <p className="text-base font-black text-amber-700">{formatCurrency(finalDebt)}</p>
              </div>
              {finalCompound > finalDebt && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-semibold">Your portfolio edge</p>
                  <p className="text-base font-black text-[#05CE78]">+{formatCurrency(finalCompound - finalDebt)}</p>
                </div>
              )}
              <Link
                href="/opportunities/debt-funds/debt-fund-series-1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors whitespace-nowrap"
              >
                Explore <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Projection assumes constant CAGR and full payout reinvestment. Actual returns may vary.
          </p>
        </div>
      </div>

      {/* ── Section 2: Payout Consistency ────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="h-1 bg-[#3B82F6]" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Payout Consistency</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Volatility score based on variance in quarterly IRR across payouts
              </p>
            </div>
          </div>

          {consistencyData.every(d => !d.consistency) ? (
            <div className="py-6 text-center text-gray-400 text-sm">
              Need at least 2 payouts per asset to compute a consistency score.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {consistencyData.map(({ inv, assetName, consistency, payoutCount }) => {
                if (!consistency) {
                  return (
                    <div key={inv.investment_id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                      <p className="text-sm font-bold text-gray-900 mb-1 truncate" title={assetName}>{assetName}</p>
                      <p className="text-xs text-gray-400">
                        {payoutCount === 0 ? "No payouts yet" : "Need ≥2 payouts to score"}
                      </p>
                    </div>
                  );
                }
                const styles = CONSISTENCY_STYLES[consistency.score];
                const maxStdDev = 10;
                const barWidth = Math.min((consistency.stdDev / maxStdDev) * 100, 100);
                return (
                  <div key={inv.investment_id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm font-bold text-gray-900 leading-snug truncate pr-2 max-w-[150px]" title={assetName}>
                        {assetName}
                      </p>
                      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
                        {CONSISTENCY_LABELS[consistency.score]}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Avg IRR</p>
                        <p className={`text-sm font-black ${styles.text}`}>{consistency.mean.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Std Dev</p>
                        <p className="text-sm font-black text-gray-900">±{consistency.stdDev.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Payouts</p>
                        <p className="text-sm font-black text-gray-900">{consistency.payoutCount}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">IRR Variance</p>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${styles.bar}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Low variance = payouts are stable quarter-on-quarter. High variance = significant fluctuation in returns.
          </p>
        </div>
      </div>

      {/* ── Section 3: Reinvestment Behaviour ────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="h-1 bg-[#6366F1]" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
              <RefreshCcw className="w-4.5 h-4.5 text-[#6366F1]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Reinvestment Behaviour</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                How much of your payouts have been put back to work
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Net Payouts</p>
              <p className="text-xl font-black text-gray-900">{formatCurrency(reinvestmentStats.totalNetPayouts)}</p>
              <p className="text-xs text-gray-400 mt-1">Received across all assets</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Capital Added</p>
              <p className="text-xl font-black text-gray-900">{formatCurrency(reinvestmentStats.capitalAdds)}</p>
              <p className="text-xs text-gray-400 mt-1">Top-ups recorded</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Est. Reinvestment</p>
              <p className="text-xl font-black text-[#6366F1]">
                {reinvestmentStats.reinvestPct.toFixed(0)}%
              </p>
              <p className="text-xs text-indigo-500 mt-1">Of payouts back in play</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 font-medium mb-2">
              <span>Reinvested</span>
              <span>Payout Pool</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6366F1] rounded-full transition-all duration-700"
                style={{ width: `${Math.min(reinvestmentStats.reinvestPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="font-bold text-[#6366F1]">{formatCurrency(reinvestmentStats.reinvestedEstimate)}</span>
              <span className="text-gray-400">{formatCurrency(reinvestmentStats.totalNetPayouts)}</span>
            </div>
          </div>

          {/* Insight callout */}
          {reinvestmentStats.unreinvested > 0 && reinvestmentStats.reinvestPct < 100 && (
            <div className="flex items-start gap-3 bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
              <ArrowUpRight className="w-4 h-4 text-[#6366F1] shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-gray-700">
                You have{" "}
                <span className="font-bold text-[#6366F1]">{formatCurrency(reinvestmentStats.unreinvested)}</span>{" "}
                in untracked payouts. Reinvesting this at {avgAnnualIrr.toFixed(1)}% could add{" "}
                <span className="font-bold text-[#6366F1]">
                  {formatCurrency(reinvestmentStats.unreinvested * (avgAnnualIrr / 100))}
                </span>{" "}
                per year.
              </p>
            </div>
          )}

          {reinvestmentStats.totalNetPayouts === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Reinvestment data will appear once you receive your first payout.
            </p>
          )}

          <p className="mt-4 text-xs text-gray-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Reinvestment % is estimated from recorded capital top-ups vs total net payouts received. Speak to your relationship manager to log a top-up.
          </p>
        </div>
      </div>

      {/* ── Section 4: Investor Trends ────────────────────────────────────── */}
      {diversification && diversification.hasEnoughData && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="h-1 bg-[#F59E0B]" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-[#F59E0B]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Investor Trends</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  How investors on this platform diversify over time
                </p>
              </div>
            </div>

            {/* Key stat */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-4 text-center">
              <p className="text-6xl font-black text-[#F59E0B] leading-none mb-2">
                {diversification.diversifiedPct}%
              </p>
              <p className="text-base font-bold text-gray-800">of investors hold 2 or more assets</p>
              {(diversification.within6mPct ?? 0) > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-bold text-amber-600">{diversification.within6mPct}%</span> of them diversified within 6 months of their first investment
                </p>
              )}
            </div>

            {/* Supporting stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg. Assets</p>
                <p className="text-xl font-black text-gray-900">{diversification.avgAssets}</p>
                <p className="text-xs text-gray-400 mt-0.5">per investor</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Diversified</p>
                <p className="text-xl font-black text-gray-900">{diversification.diversifiedCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">investors</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your Assets</p>
                <p className={`text-xl font-black ${myAssetCount >= 2 ? "text-[#05CE78]" : "text-gray-900"}`}>
                  {myAssetCount}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">in your portfolio</p>
              </div>
            </div>

            {/* Contextual message based on investor's own position */}
            {myAssetCount >= 2 ? (
              <div className="flex items-start gap-3 bg-[#05CE78]/5 border border-[#05CE78]/20 rounded-xl px-4 py-3">
                <Sparkles className="w-4 h-4 text-[#05CE78] shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-700">
                  You&#39;re already diversified across <span className="font-bold text-[#05CE78]">{myAssetCount} assets</span>, ahead of the curve. Explore new opportunities to keep spreading your exposure.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <ArrowUpRight className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-700">
                  You currently hold <span className="font-bold">1 asset</span>. Most investors on this platform diversify into a second within 6 months, spreading across asset classes to smooth out payout variance.
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-400 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Aggregate data only. No individual investor information is shared.
              </p>
              <a
                href="/dashboard/opportunities"
                className="text-xs font-bold text-[#05CE78] hover:text-[#04b86c] transition-colors flex items-center gap-1 shrink-0 ml-4"
              >
                Explore opportunities <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Referral Program Coming Soon ─────────────────────────────────── */}
      <div className="bg-[#0B1120] rounded-2xl overflow-hidden shadow-sm">
        <div className="h-1 bg-gradient-to-r from-[#05CE78] to-emerald-400" />
        <div className="p-6 sm:p-8">

          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#05CE78]/10 rounded-xl flex items-center justify-center border border-[#05CE78]/20">
                <Gift className="w-5 h-5 text-[#05CE78]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-white">Referral Program</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-gray-400">Earn rewards for bringing new investors onto the platform</p>
              </div>
            </div>
          </div>

          {/* Proposed terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Signing Bonus</p>
              <p className="text-2xl font-black text-[#05CE78]">1%</p>
              <p className="text-xs text-gray-400 mt-1">on referred investor&#39;s first deposit</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Above ₹10L</p>
              <p className="text-xl font-black text-white leading-tight">Signing +<br />Payout Bonus</p>
              <p className="text-xs text-gray-400 mt-1">dual reward for high-value referrals</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Caps</p>
              <p className="text-2xl font-black text-amber-400">TBD</p>
              <p className="text-xs text-gray-400 mt-1">limits to be finalised before launch</p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleReferralSignup}
            disabled={referralRegistered || referralLoading}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              referralRegistered
                ? "bg-[#05CE78]/10 text-[#05CE78] border border-[#05CE78]/30 cursor-default"
                : "bg-[#05CE78] hover:bg-[#04b86c] text-black active:scale-[0.98] disabled:opacity-70"
            }`}
          >
            {referralLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
            ) : referralRegistered ? (
              <><CheckCircle className="w-4 h-4" /> You&#39;re on the early access list</>
            ) : (
              <><Gift className="w-4 h-4" /> Notify me when it launches</>
            )}
          </button>

          {!referralRegistered && (
            <p className="text-xs text-gray-600 mt-3">
              One click. We&#39;ll notify you via email when the referral program goes live.
            </p>
          )}

        </div>
      </div>

    </div>
  );
}
