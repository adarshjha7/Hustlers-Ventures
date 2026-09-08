"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, CreditCard, UserCheck, TrendingUp, Wallet,
  Clock, BadgeCheck, ExternalLink, ChevronDown, ChevronRight,
  ArrowDownCircle, ArrowUpCircle, Loader2, Pencil, X, Save,
  User, CheckCircle2, AlertCircle, Activity,
} from "lucide-react";
import { formatCurrency, formatLoanTerms, type DebtTerms } from "@/lib/formatters";
import { useToast } from "@/hooks/useToast";

interface Investment {
  investment_id: string;
  name: string;
  total_amount: number;
  agreement_url: string | null;
  created_at: string;
  transaction_count: number;
  debt_terms: DebtTerms;
}

interface Payout {
  payment_id: string;
  investment_id: string;
  asset_name: string;
  quarter_year: string;
  roi_percentage: number | null;
  gross_roi_amount: number;
  tds_deduction: number;
  emergency_fund_deduction: number;
  net_payable_amount: number;
  months_considered: number | null;
  payment_date: string | null;
  payment_reference: string | null;
  receipt_url: string | null;
}

interface CapitalTx {
  transaction_id: string;
  investment_amount: number;
  transaction_type: "add" | "withdrawal";
  remarks: string | null;
  receipt_url: string | null;
  created_at: string;
}

interface Investor {
  investor_id: string;
  user_id: string;
  investor_name: string;
  email: string;
  phone: string | null;
  pan_number: string | null;
  associate_name: string | null;
  is_active: boolean;
  requires_password_change: boolean;
}

interface Stats {
  totalDeployed: number;
  totalGross: number;
  totalReceived: number;
  totalTds: number;
  totalEf: number;
  pendingPayouts: number;
}

interface TimelineEvent {
  type: "investment" | "payout" | "pending_payout";
  date: string;
  title: string;
  amount: number;
  meta: string | null;
}

interface Props {
  investor: Investor;
  investments: Investment[];
  payouts: Payout[];
  stats: Stats;
  netPaidPerInvestment: Record<string, number>;
  timeline: TimelineEvent[];
}

export default function InvestorDetailClient({ investor: initialInvestor, investments, payouts, stats, netPaidPerInvestment, timeline }: Props) {
  const [investor, setInvestor] = useState(initialInvestor);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [txCache, setTxCache] = useState<Record<string, CapitalTx[]>>({});
  const [loadingTx, setLoadingTx] = useState<string | null>(null);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: investor.investor_name,
    phone: investor.phone ?? "",
    panNumber: investor.pan_number ?? "",
    associateName: investor.associate_name ?? "",
    isActive: investor.is_active !== false,
  });
  const [saving, setSaving] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const toggleExpand = async (investmentId: string) => {
    if (expandedId === investmentId) { setExpandedId(null); return; }
    setExpandedId(investmentId);
    if (txCache[investmentId]) return;
    setLoadingTx(investmentId);
    const res = await fetch(`/api/admin/transactions?investmentId=${investmentId}`);
    const data = await res.json();
    setTxCache(prev => ({ ...prev, [investmentId]: data.transactions ?? [] }));
    setLoadingTx(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/investors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        investorId: investor.investor_id,
        name: editForm.name,
        phone: editForm.phone,
        panNumber: editForm.panNumber,
        associateName: editForm.associateName,
        isActive: editForm.isActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error || "Failed to save.");
    } else {
      setInvestor(prev => ({
        ...prev,
        investor_name: editForm.name,
        phone: editForm.phone || null,
        pan_number: editForm.panNumber || null,
        associate_name: editForm.associateName || null,
        is_active: editForm.isActive,
      }));
      showToast("success", "Investor updated.");
      setShowEdit(false);
    }
    setSaving(false);
  };

  const statusLabel = investor.is_active === false
    ? { text: "Inactive", cls: "bg-gray-100 text-gray-500 border-gray-200" }
    : investor.requires_password_change
    ? { text: "Pending Setup", cls: "bg-orange-50 text-orange-600 border-orange-100" }
    : { text: "Active", cls: "bg-green-50 text-green-700 border-green-100" };

  const initials = investor.investor_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const returnedPct = stats.totalDeployed > 0 ? Math.min(100, (stats.totalReceived / stats.totalDeployed) * 100) : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Back */}
      <Link href="/admin/investors" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 font-medium transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Investors
      </Link>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${toast.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
          <button onClick={clearToast} className="ml-auto opacity-50 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#05CE78]/10 border border-[#05CE78]/20 flex items-center justify-center text-[#05CE78] font-extrabold text-lg shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-extrabold text-gray-900">{investor.investor_name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-md border ${statusLabel.cls}`}>
                {statusLabel.text}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />{investor.email}</span>
              {investor.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{investor.phone}</span>}
              {investor.pan_number && <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-gray-400" /><span className="font-mono tracking-wider">{investor.pan_number}</span></span>}
              {investor.associate_name && <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-gray-400" />{investor.associate_name}</span>}
            </div>
          </div>
          <button
            onClick={() => { setEditForm({ name: investor.investor_name, phone: investor.phone ?? "", panNumber: investor.pan_number ?? "", associateName: investor.associate_name ?? "", isActive: investor.is_active !== false }); setShowEdit(true); }}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {[
          { label: "Deployed", value: formatCurrency(stats.totalDeployed), sub: `${investments.length} investment${investments.length !== 1 ? "s" : ""}`, accent: "border-t-[#05CE78]" },
          { label: "Gross Paid", value: formatCurrency(stats.totalGross), sub: `${payouts.filter(p => p.payment_date).length} payouts`, accent: "border-t-emerald-400" },
          { label: "Net Received", value: formatCurrency(stats.totalReceived), sub: "after deductions", accent: "border-t-blue-400" },
          { label: "TDS Deducted", value: formatCurrency(stats.totalTds), sub: "across all payouts", accent: "border-t-red-400" },
          ...(stats.totalEf > 0 ? [{ label: "Emergency Fund", value: formatCurrency(stats.totalEf), sub: "held in reserve", accent: "border-t-amber-400" }] : []),
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border border-gray-200 p-5 border-t-4 ${s.accent}`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-lg font-extrabold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Capital returned bar */}
      {stats.totalDeployed > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Capital Returned via Payouts</span>
            <span className="text-sm font-black text-gray-800">{returnedPct.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${returnedPct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {formatCurrency(stats.totalReceived)} net received of {formatCurrency(stats.totalDeployed)} deployed
          </p>
        </div>
      )}

      {/* Activity Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#05CE78]" />
            <h2 className="font-bold text-gray-900 text-sm">Activity Timeline</h2>
            <span className="ml-auto text-xs text-gray-400">{timeline.length} events</span>
          </div>
          <div className="px-6 py-4">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-4">
                {timeline.map((event, i) => {
                  const isPayout    = event.type === "payout";
                  const isPending   = event.type === "pending_payout";
                  const isInvest    = event.type === "investment";
                  const dotColor    = isInvest ? "bg-blue-500" : isPayout ? "bg-emerald-500" : "bg-amber-400";
                  const amountColor = isInvest ? "text-blue-700" : isPayout ? "text-emerald-700" : "text-amber-600";
                  return (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div className={`w-8 h-8 rounded-full ${dotColor}/10 border-2 ${dotColor.replace("bg-", "border-")} flex items-center justify-center shrink-0 z-10 bg-white`}>
                        {isInvest  ? <TrendingUp className={`w-3.5 h-3.5 text-blue-500`} />
                         : isPayout ? <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                         : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                          <p className={`text-sm font-bold tabular-nums shrink-0 ${amountColor}`}>
                            {isInvest ? "-" : "+"}{formatCurrency(event.amount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {event.meta && <p className="text-xs text-gray-400">{event.meta}</p>}
                          <p className="text-xs text-gray-400 ml-auto">
                            {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investments - expandable */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#05CE78]" />
          <h2 className="font-bold text-gray-900 text-sm">Investments</h2>
          <span className="ml-auto text-xs text-gray-400">{investments.length} record{investments.length !== 1 ? "s" : ""}</span>
        </div>
        {investments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No investments recorded.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {investments.map(inv => {
              const isOpen = expandedId === inv.investment_id;
              const netPaid = netPaidPerInvestment[inv.investment_id] ?? 0;
              const retPct = Number(inv.total_amount) > 0 ? Math.min(100, (netPaid / Number(inv.total_amount)) * 100) : 0;
              const invPayouts = payouts.filter(p => p.investment_id === inv.investment_id);
              const txs = txCache[inv.investment_id] ?? [];

              return (
                <div key={inv.investment_id}>
                  {/* Row header - clickable */}
                  <button
                    onClick={() => toggleExpand(inv.investment_id)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="shrink-0 text-gray-400">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{inv.name}</p>
                        {Number(inv.total_amount) > 0
                          ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-bold border border-green-100"><div className="w-1.5 h-1.5 rounded-full bg-green-500" />Active</span>
                          : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100"><div className="w-1.5 h-1.5 rounded-full bg-orange-400" />Exited</span>
                        }
                        {inv.debt_terms && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-cyan-50 text-cyan-700 text-[10px] font-bold border border-cyan-100">
                            {formatLoanTerms(inv.debt_terms)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(inv.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {inv.transaction_count > 0 && <span className="ml-2">· {inv.transaction_count} capital txn{inv.transaction_count !== 1 ? "s" : ""}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900 tabular-nums">{Number(inv.total_amount) > 0 ? formatCurrency(inv.total_amount) : <span className="text-gray-400 text-sm">Capital returned</span>}</p>
                      {netPaid > 0 && <p className="text-xs text-emerald-600 mt-0.5">{formatCurrency(netPaid)} returned ({retPct.toFixed(1)}%)</p>}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-6 pb-6 bg-gray-50/50 border-t border-gray-100 space-y-5">

                      {/* Agreement */}
                      {inv.agreement_url && (
                        <div className="pt-4">
                          <a href={inv.agreement_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-colors">
                            <ExternalLink className="w-4 h-4" /> View Investment Agreement
                          </a>
                        </div>
                      )}

                      {/* Payouts for this investment */}
                      <div className="pt-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payouts</p>
                        {invPayouts.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4 bg-white border border-gray-100 rounded-xl">No payouts yet.</p>
                        ) : (() => {
                          const totalGross = invPayouts.reduce((s, p) => s + Number(p.gross_roi_amount), 0);
                          const totalNet = invPayouts.reduce((s, p) => s + Number(p.net_payable_amount), 0);
                          const totalTds = invPayouts.reduce((s, p) => s + Number(p.tds_deduction), 0);
                          const totalEf = invPayouts.reduce((s, p) => s + Number(p.emergency_fund_deduction), 0);
                          const capPct = Number(inv.total_amount) > 0 ? Math.min(100, (totalNet / Number(inv.total_amount)) * 100) : 0;
                          return (
                            <>
                              <div className="grid grid-cols-4 gap-2 mb-3">
                                {[
                                  { label: "Gross", value: formatCurrency(totalGross), cls: "text-gray-800" },
                                  { label: "TDS", value: formatCurrency(totalTds), cls: "text-red-600" },
                                  { label: "EF", value: formatCurrency(totalEf), cls: "text-amber-600" },
                                  { label: "Net", value: formatCurrency(totalNet), cls: "text-emerald-700" },
                                ].map(s => (
                                  <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-center">
                                    <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
                                    <p className={`text-sm font-black mt-0.5 ${s.cls}`}>{s.value}</p>
                                  </div>
                                ))}
                              </div>
                              {Number(inv.total_amount) > 0 && (
                                <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 mb-3">
                                  <div className="flex justify-between mb-1.5">
                                    <span className="text-xs font-bold text-gray-600">Capital Returned</span>
                                    <span className="text-xs font-black text-gray-800">{capPct.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${capPct}%` }} />
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(totalNet)} of {formatCurrency(inv.total_amount)}</p>
                                </div>
                              )}
                              <div className="space-y-2">
                                {invPayouts.map(p => {
                                  const roi = p.roi_percentage != null
                                    ? p.roi_percentage
                                    : (p.gross_roi_amount && p.months_considered)
                                      ? (Number(p.gross_roi_amount) / Number(inv.total_amount)) * (12 / p.months_considered) * 100
                                      : null;
                                  return (
                                    <div key={p.payment_id} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                                          {p.quarter_year}
                                          {roi != null && (
                                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">
                                              {roi.toFixed(1)}% ROI{p.roi_percentage == null ? "*" : ""}
                                            </span>
                                          )}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          {p.payment_date
                                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-100"><BadgeCheck className="w-3 h-3" /> {new Date(p.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-100"><Clock className="w-3 h-3" /> Pending</span>
                                          }
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div><p className="text-gray-400 mb-0.5">Gross</p><p className="font-bold text-gray-800">{formatCurrency(p.gross_roi_amount)}</p></div>
                                        <div><p className="text-gray-400 mb-0.5">TDS</p><p className="font-bold text-red-600">-{formatCurrency(p.tds_deduction)}</p></div>
                                        <div><p className="text-gray-400 mb-0.5">EF</p><p className="font-bold text-amber-600">-{formatCurrency(p.emergency_fund_deduction)}</p></div>
                                        <div><p className="text-gray-400 mb-0.5">Net</p><p className="font-bold text-emerald-700">{formatCurrency(p.net_payable_amount)}</p></div>
                                      </div>
                                      {(p.payment_reference || p.receipt_url) && (
                                        <div className="flex items-center justify-between mt-1.5">
                                          {p.payment_reference && <p className="text-xs text-gray-400">Ref: {p.payment_reference}</p>}
                                          {p.receipt_url && (
                                            <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 ml-auto transition-colors">
                                              <ExternalLink className="w-3 h-3" /> Receipt
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Capital transactions */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Capital Transactions</p>
                        {loadingTx === inv.investment_id ? (
                          <div className="flex justify-center py-5"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
                        ) : txs.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4 bg-white border border-gray-100 rounded-xl">No capital transactions yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {txs.map(tx => (
                              <div key={tx.transaction_id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                                <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${tx.transaction_type === "add" ? "bg-green-100" : "bg-red-100"}`}>
                                  {tx.transaction_type === "add"
                                    ? <ArrowDownCircle className="w-3.5 h-3.5 text-green-600" />
                                    : <ArrowUpCircle className="w-3.5 h-3.5 text-red-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-sm font-bold ${tx.transaction_type === "add" ? "text-green-700" : "text-red-600"}`}>
                                      {tx.transaction_type === "add" ? "+" : "-"}{formatCurrency(tx.investment_amount)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                  </div>
                                  {tx.remarks && <p className="text-xs text-gray-500 mt-0.5">{tx.remarks}</p>}
                                  {tx.receipt_url && (
                                    <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 transition-colors">
                                      <ExternalLink className="w-3 h-3" /> Receipt
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && setShowEdit(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Edit Investor</h3>
                <p className="text-xs text-gray-400 mt-0.5">{investor.email}</p>
              </div>
              <button onClick={() => setShowEdit(false)} disabled={saving} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5"><User className="w-3 h-3 inline mr-1" /> Full Name *</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Phone</label>
                  <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">PAN Number</label>
                  <input type="text" value={editForm.panNumber} onChange={e => setEditForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" maxLength={10}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm font-mono tracking-wider" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Associate Name</label>
                  <input type="text" value={editForm.associateName} onChange={e => setEditForm(f => ({ ...f, associateName: e.target.value }))} placeholder="Referring associate"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} className="sr-only" />
                      <div onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
                        className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${editForm.isActive ? "bg-[#05CE78]" : "bg-gray-300"} flex items-center px-[3px]`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${editForm.isActive ? "translate-x-[18px]" : "translate-x-0"}`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Account Active</p>
                      <p className="text-xs text-gray-400">{editForm.isActive ? "Investor can log in" : "Login disabled"}</p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowEdit(false)} disabled={saving}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !editForm.name}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
