"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, Plus, CheckCircle2, AlertCircle, Loader2, IndianRupee,
  Calendar, Building2, User, ArrowDownCircle, ArrowUpCircle,
  Trash2, FileText, X, Receipt, Search, Eye, Copy, Check, ExternalLink, Download, Wallet, Send,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { SortIcon } from "@/components/admin/SortIcon";
import { buildPaginationPages } from "@/lib/paginationHelper";
import { logEvent } from "@/lib/logger";
import { exportToCsv } from "@/lib/exportCsv";
// Multi-step flow disabled - its behavior is now folded into the Add Investment modal.
// import NewAddInvestmentDialog from "@/components/NewAddInvestmentDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Investor {
  investor_id: string;
  user_id: string | null;
  investor_name: string;
  email: string;
}

interface Pool {
  purchase_id: string;
  pool_name: string;
  pool_type: "investment" | "debt" | null;
  status: string;
  total_cost: number;
}

interface Investment {
  investment_id: string;
  name: string;
  company_name: string | null;
  pool_id: string | null;
  purchase_id: string | null;
  pool_name: string | null;
  agreement_url: string | null;
  total_amount: number;
  created_at: string;
  user_id: string;
  investor_id: string;
  investor_name: string;
  email: string;
  transaction_count: number;
}

interface Payout {
  payment_id: string;
  gross_roi_amount: number;
  emergency_fund_deduction: number;
  tds_deduction: number;
  net_payable_amount: number;
  payment_date: string | null;
  payment_reference: string | null;
  receipt_url: string | null;
  quarter_year: string;
  roi_percentage: number | null;
  months_considered: number | null;
}

interface CapitalTransaction {
  transaction_id: string;
  investment_amount: number;
  transaction_type: "add" | "withdrawal";
  remarks: string | null;
  receipt_url: string | null;
  created_at: string;
}

interface PendingReceipt {
  transaction_id: string;
  investor_name: string;
  investor_has_email: boolean;
  pool_name: string;
  amount: number;
  created_at: string;
}

const emptyAddForm = {
  investorId: "",
  poolId: "",
  companyName: "",
  amount: "",
  investedDate: new Date().toISOString().split("T")[0],
  remarks: "",
  debtRoiPercentage: "",
  debtTermMonths: "",
  debtPaymentCycle: "quarterly" as "monthly" | "quarterly" | "half_yearly" | "annual",
};

const emptyTxForm = {
  transactionType: "add" as "add" | "withdrawal",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  remarks: "",
  receiptUrl: "",
};

const PAGE_SIZE = 15;

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"investor_name" | "name" | "total_amount" | "created_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "total_amount" || key === "created_at" ? "desc" : "asc"); setPage(1); }
  };
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add investment modal
  const [showAddModal, setShowAddModal] = useState(false);
  // const [multiStepOpen, setMultiStepOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  // The target the admin picked: an existing investment_id, or "new" for a separate investment.
  // Defaults to the first existing investment when an investor+pool combo with prior investments
  // is chosen; resets to "new" when there are no existing investments.
  const [addTarget, setAddTarget] = useState<string | "new">("new");
  const [addTxType, setAddTxType] = useState<"add" | "withdrawal">("add");

  // Transaction modal
  const [txTarget, setTxTarget] = useState<Investment | null>(null);
  const [txForm, setTxForm] = useState(emptyTxForm);
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View detail modal
  const [viewTarget, setViewTarget] = useState<Investment | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [viewTransactions, setViewTransactions] = useState<CapitalTransaction[]>([]);
  const [viewTxLoading, setViewTxLoading] = useState(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [viewPayouts, setViewPayouts] = useState<Payout[]>([]);
  const [viewPayoutsLoading, setViewPayoutsLoading] = useState(false);

  // Pending receipts
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [triggeringName, setTriggeringName] = useState<string | null>(null);

  const fetchPendingReceipts = useCallback(async () => {
    setPendingLoading(true);
    const data = await fetch("/api/admin/receipts/pending").then(r => r.json());
    setPendingReceipts(data.pending ?? []);
    setPendingLoading(false);
  }, []);

  useEffect(() => { fetchPendingReceipts(); }, [fetchPendingReceipts]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [investmentsRes, investorsRes, poolsRes] = await Promise.all([
      fetch("/api/admin/investments").then(r => r.json()),
      fetch("/api/admin/investors").then(r => r.json()),
      fetch("/api/admin/pools").then(r => r.json()),
    ]);
    setInvestments(investmentsRes.investments ?? []);
    setInvestors(investorsRes.investors ?? []);
    setPools(poolsRes.pools ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!viewTarget) { setViewTransactions([]); setViewPayouts([]); return; }
    setViewTxLoading(true);
    setViewPayoutsLoading(true);
    fetch(`/api/admin/transactions?investmentId=${viewTarget.investment_id}`)
      .then(r => r.json())
      .then(d => setViewTransactions(d.transactions ?? []))
      .finally(() => setViewTxLoading(false));
    fetch(`/api/admin/payouts?investmentId=${viewTarget.investment_id}`)
      .then(r => r.json())
      .then(d => setViewPayouts(d.payouts ?? []))
      .finally(() => setViewPayoutsLoading(false));
  }, [viewTarget]);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const selectedInvestor = investors.find(i => i.investor_id === addForm.investorId);
  const selectedPool = pools.find(p => p.purchase_id === addForm.poolId);
  // Debt pools (loans to the business) carry per-investment ROI/tenure/payment cycle instead
  // of the pool-wide quarterly ROI declaration. Only relevant for a brand-new investment - a
  // top-up to an existing debt investment reuses that investment's original terms.
  const isDebtPool = selectedPool?.pool_type === "debt";
  const showDebtTermsFields = isDebtPool && addTarget === "new";
  // All investments by this investor in this pool - used to offer "add to existing X".
  const existingInPool = useMemo(
    () =>
      addForm.investorId && addForm.poolId
        ? investments.filter(
            (inv) =>
              inv.investor_id === addForm.investorId &&
              inv.purchase_id === addForm.poolId
          )
        : [],
    [investments, addForm.investorId, addForm.poolId]
  );

  // Whenever the existing list changes, default the target to the first existing
  // (or "new" if none) so the admin doesn't have to click before submitting.
  useEffect(() => {
    setAddTarget(existingInPool[0]?.investment_id ?? "new");
    setAddTxType("add");
  }, [existingInPool]);

  const totalDeployed = investments.reduce((sum, i) => sum + Number(i.total_amount), 0);

  // Group pending receipts by investor - generateForOne() triggers all of one investor's
  // pending receipts at once, so that's the unit the admin picks from.
  const pendingByInvestor = useMemo(() => {
    const map = new Map<string, { investor_name: string; count: number; total: number; pools: Set<string>; hasEmail: boolean }>();
    for (const p of pendingReceipts) {
      const entry = map.get(p.investor_name) ?? { investor_name: p.investor_name, count: 0, total: 0, pools: new Set<string>(), hasEmail: p.investor_has_email };
      entry.count += 1;
      entry.total += p.amount;
      entry.pools.add(p.pool_name);
      map.set(p.investor_name, entry);
    }
    return [...map.values()].sort((a, b) => a.investor_name.localeCompare(b.investor_name));
  }, [pendingReceipts]);

  const q = search.toLowerCase();
  const filtered = investments.filter(inv =>
    inv.investor_name.toLowerCase().includes(q) ||
    inv.name.toLowerCase().includes(q) ||
    inv.email.toLowerCase().includes(q)
  );

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    const cmp = typeof av === "number"
      ? (av as number) - (bv as number)
      : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  }), [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If an existing investment is selected, POST a transaction. Otherwise create a new one.
    const shouldTopUp = addTarget !== "new";
    const existingTarget = shouldTopUp ? existingInPool.find(i => i.investment_id === addTarget) : null;

    if (shouldTopUp && addTxType === "withdrawal" && existingTarget && Number(addForm.amount) > Number(existingTarget.total_amount)) {
      setStatus({ type: "error", message: `Withdrawal exceeds current balance of ${formatCurrency(existingTarget.total_amount)}.` });
      return;
    }

    setAddSubmitting(true);

    const res = shouldTopUp
      ? await fetch("/api/admin/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            investmentId: addTarget,
            amount: addForm.amount,
            transactionType: addTxType,
            remarks: addForm.remarks || null,
            createdAt: addForm.investedDate
              ? new Date(addForm.investedDate).toISOString()
              : new Date().toISOString(),
          }),
        })
      : await fetch("/api/admin/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            investorId: addForm.investorId,
            poolId: addForm.poolId || null,
            companyName: addForm.companyName || null,
            amount: addForm.amount,
            investedDate: addForm.investedDate,
            remarks: addForm.remarks || null,
            ...(showDebtTermsFields ? {
              debtRoiPercentage: addForm.debtRoiPercentage || null,
              debtTermMonths: addForm.debtTermMonths || null,
              debtPaymentCycle: addForm.debtPaymentCycle,
            } : {}),
          }),
        });

    const data = await res.json();
    if (!res.ok) {
      setStatus({ type: "error", message: data.error });
    } else {
      const action = shouldTopUp ? (addTxType === "withdrawal" ? "withdrawn from" : "added to existing") : "created";
      setStatus({
        type: "success",
        message: `${formatCurrency(Number(addForm.amount))} ${action} for ${selectedInvestor?.investor_name}.`,
      });
      logEvent("INFO", "Admin added investment", {
        investorName: selectedInvestor?.investor_name,
        amount: addForm.amount,
        asset: selectedPool?.pool_name || addForm.companyName,
        topUp: shouldTopUp,
        transactionType: shouldTopUp ? addTxType : "add",
      }).catch(console.error);
      setAddForm(emptyAddForm);
      setAddTarget("new");
      setAddTxType("add");
      setShowAddModal(false);
      fetchAll();
      fetchPendingReceipts();
    }
    setAddSubmitting(false);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTarget) return;
    setTxSubmitting(true);
    const res = await fetch("/api/admin/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        investmentId: txTarget.investment_id,
        amount: txForm.amount,
        transactionType: txForm.transactionType,
        remarks: txForm.remarks || null,
        receiptUrl: txForm.receiptUrl || null,
        createdAt: txForm.date,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus({ type: "error", message: data.error });
    } else {
      setStatus({ type: "success", message: `${txForm.transactionType === "add" ? "Add" : "Withdrawal"} of ${formatCurrency(Number(txForm.amount))} recorded for ${txTarget.name}.` });
      logEvent("INFO", "Admin recorded transaction", { investmentId: txTarget.investment_id, investmentName: txTarget.name, type: txForm.transactionType, amount: txForm.amount }).catch(console.error);
      setTxForm(emptyTxForm);
      setTxTarget(null);
      fetchAll();
      fetchPendingReceipts();
    }
    setTxSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/investments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investmentId: deleteTarget.investment_id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus({ type: "error", message: data.error });
    } else {
      setInvestments(prev => prev.filter(i => i.investment_id !== deleteTarget.investment_id));
      setStatus({ type: "success", message: `Investment "${deleteTarget.name}" deleted.` });
      logEvent("WARN", "Admin deleted investment", { investmentId: deleteTarget.investment_id, name: deleteTarget.name }).catch(console.error);
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const paginationPages = buildPaginationPages(page, totalPages);

  const copyToClipboard = (value: string, fieldKey: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1500);
    });
  };

  const handleDeleteTx = async (txId: string) => {
    setDeletingTxId(txId);
    const res = await fetch("/api/admin/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: txId }),
    });
    if (res.ok) {
      setViewTransactions(prev => prev.filter(t => t.transaction_id !== txId));
      setInvestments(prev => prev.map(inv =>
        inv.investment_id === viewTarget?.investment_id
          ? { ...inv, transaction_count: Math.max(0, inv.transaction_count - 1) }
          : inv
      ));
      setStatus({ type: "success", message: "Capital transaction deleted." });
      logEvent("WARN", "Admin deleted transaction", { transactionId: txId, investmentId: viewTarget?.investment_id }).catch(console.error);
    } else {
      setStatus({ type: "error", message: "Failed to delete transaction." });
    }
    setDeletingTxId(null);
  };

  const handleTriggerReceipt = async (investorName: string) => {
    setTriggeringName(investorName);
    const res = await fetch("/api/admin/receipts/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investorName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus({ type: "error", message: data.error || `Failed to trigger receipts for ${investorName}.` });
    } else {
      setStatus({ type: "success", message: `Receipt${pendingByInvestor.find(p => p.investor_name === investorName)!.count > 1 ? "s" : ""} generated and emailed for ${investorName}.` });
      logEvent("INFO", "Admin triggered receipt generation", { investorName }).catch(console.error);
      fetchPendingReceipts();
    }
    setTriggeringName(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#05CE78]" /> Investments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {investments.length} records · {formatCurrency(totalDeployed)} deployed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv(`investments-${new Date().toISOString().split("T")[0]}.csv`, filtered, [
              { key: "investor_name",    label: "Investor" },
              { key: "email",            label: "Email" },
              { key: "name",             label: "Asset" },
              { key: "total_amount",     label: "Amount" },
              { key: "created_at",       label: "Invested On" },
              { key: "transaction_count",label: "Capital Transactions" },
            ])}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          {/* Multi-step button disabled - behavior now lives inside the Add Investment modal.
          <button
            onClick={() => setMultiStepOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-purple-600 border border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> New (Multi-step)
          </button>
          */}
          <button
            onClick={() => { setShowAddModal(true); setStatus(null); setAddForm(emptyAddForm); setAddTarget("new"); setAddTxType("add"); }}
            className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b067] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-900/20 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Investment
          </button>
        </div>

        {/* <NewAddInvestmentDialog
          open={multiStepOpen}
          onOpenChange={setMultiStepOpen}
          onSuccess={fetchAll}
        /> */}
      </div>

      {/* Status banner */}
      {status && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${status.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
          {status.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {status.message}
          <button onClick={() => setStatus(null)} className="ml-auto opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Pending Receipts */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#05CE78]" /> Pending Receipts
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Capital added but no receipt generated yet. Trigger sends the PDF receipt by email.</p>
          </div>
        </div>

        {pendingLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#05CE78]" /></div>
        ) : pendingByInvestor.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No pending receipts. Everyone's up to date.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Investor</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset(s)</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingByInvestor.map(p => (
                <tr key={p.investor_name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {p.investor_name}
                    {!p.hasEmail && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-bold border border-red-100" title="No email on file for this investor - the receipt PDF will still be generated, but it can't be emailed until you add one.">
                        <AlertCircle className="w-3 h-3" /> No email
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{[...p.pools].join(", ")}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-md border border-orange-100">{p.count}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 tabular-nums">{formatCurrency(p.total)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleTriggerReceipt(p.investor_name)}
                      disabled={triggeringName === p.investor_name || !p.hasEmail}
                      title={!p.hasEmail ? "Add an email for this investor first." : undefined}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#05CE78] hover:bg-[#04b86c] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {triggeringName === p.investor_name
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                        : <><Send className="w-3.5 h-3.5" /> Trigger</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="font-bold text-gray-900 text-sm">All Investments</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search investor, asset or email..."
              className="pl-9 py-2 pr-4 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-72"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {search ? `No investments matching "${search}".` : "No investments found."}
          </div>
        ) : (
          <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[26%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {([
                    { key: "investor_name", label: "Investor", align: "left" },
                    { key: "name",          label: "Asset",    align: "left" },
                    { key: "total_amount",  label: "Amount",   align: "right" },
                    { key: "created_at",    label: "Date",     align: "left" },
                  ] as { key: typeof sortKey; label: string; align: string }[]).map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)}
                      className={`px-6 py-3 text-${col.align} text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900`}>
                      <span className={`flex items-center gap-1 ${col.align === "right" ? "justify-end" : ""}`}>
                        {col.label} <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Txns</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(inv => (
                  <tr key={inv.investment_id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 truncate">{inv.investor_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{inv.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-gray-700">{inv.name}</span>
                        {Number(inv.total_amount) > 0
                          ? <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-bold border border-green-100"><div className="w-1.5 h-1.5 rounded-full bg-green-500" />Active</span>
                          : <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-xs font-bold border border-orange-100"><div className="w-1.5 h-1.5 rounded-full bg-orange-400" />Exited</span>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 tabular-nums">
                      {Number(inv.total_amount) > 0 ? formatCurrency(inv.total_amount) : <span className="text-gray-400 text-sm font-medium">Exited</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {inv.transaction_count > 0 && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-100">
                            {inv.transaction_count}
                          </span>
                        )}
                        <button
                          onClick={() => { setTxTarget(inv); setTxForm(emptyTxForm); }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-gray-500 border border-gray-200 rounded-lg hover:border-[#05CE78] hover:text-[#05CE78] hover:bg-green-50 transition-colors"
                          title="Record transaction"
                        >
                          <Plus className="w-3 h-3" /> Txn
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setViewTarget(inv)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(inv)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete investment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}

        {/* Pagination */}
        {!loading && sorted.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, sorted.length)}</span> of <span className="font-semibold text-gray-600">{sorted.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Prev
              </button>
              {paginationPages.map((p, i) =>
                p === "…" ? (
                  <span key={`e-${i}`} className="px-2 text-xs text-gray-400">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${page === p ? "bg-[#0B1120] text-white border-[#0B1120]" : "text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900"}`}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ADD INVESTMENT MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !addSubmitting && setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Add Investment</h3>
                <p className="text-xs text-gray-400 mt-0.5">Link a new investment to an investor account.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} disabled={addSubmitting} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              {/* Investor */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  <User className="w-3 h-3 inline mr-1" /> Investor *
                </label>
                <select value={addForm.investorId} onChange={e => setAddForm(f => ({ ...f, investorId: e.target.value }))} required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm">
                  <option value="">- Select investor -</option>
                  {investors.map(inv => (
                    <option key={inv.investor_id} value={inv.investor_id}>
                      {inv.investor_name} {inv.email ? `(${inv.email})` : "(pending — not yet registered)"}
                    </option>
                  ))}
                </select>
                {selectedInvestor && <p className="text-xs text-[#05CE78] font-medium mt-1.5">✓ {selectedInvestor.investor_name}</p>}
              </div>

              {/* Pool or custom name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  <Building2 className="w-3 h-3 inline mr-1" /> Asset *
                </label>
                <select value={addForm.poolId} onChange={e => setAddForm(f => ({ ...f, poolId: e.target.value, companyName: "" }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm mb-3">
                  <option value="">- Select a pool -</option>
                  {pools.map(p => (
                    <option key={p.purchase_id} value={p.purchase_id}>{p.pool_name} · {p.status}</option>
                  ))}
                </select>
                {!addForm.poolId && (
                  <input type="text" value={addForm.companyName}
                    onChange={e => setAddForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="Or enter custom asset name..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
                  />
                )}
              </div>

              {showDebtTermsFields && (
                <div className="space-y-3 p-4 bg-cyan-50/50 border border-cyan-100 rounded-xl">
                  <p className="text-xs font-bold text-cyan-800 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Loan Terms for this Debt Investment
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        ROI (% p.a.)
                      </label>
                      <input type="number" step="0.01" min={0} value={addForm.debtRoiPercentage}
                        onChange={e => setAddForm(f => ({ ...f, debtRoiPercentage: e.target.value }))}
                        placeholder="20"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Tenure (months)
                      </label>
                      <input type="number" min={0} value={addForm.debtTermMonths}
                        onChange={e => setAddForm(f => ({ ...f, debtTermMonths: e.target.value }))}
                        placeholder="6"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Payment Cycle
                      </label>
                      <select value={addForm.debtPaymentCycle}
                        onChange={e => setAddForm(f => ({ ...f, debtPaymentCycle: e.target.value as typeof f.debtPaymentCycle }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] text-sm">
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half_yearly">Half-Yearly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-cyan-700/80">
                    Fixed ROI% and tenure drive payout calculation for this investment directly, instead of the pool&apos;s quarterly ROI declaration. Payment cycle is informational only.
                  </p>
                </div>
              )}

              {existingInPool.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    {existingInPool.length} existing investment{existingInPool.length === 1 ? "" : "s"} for{" "}
                    {selectedInvestor?.investor_name} in {selectedPool?.pool_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Pick an existing one to top it up, or create a separate investment.
                  </p>

                  <div className="space-y-1.5">
                    {existingInPool.map((inv) => {
                      const isSelected = addTarget === inv.investment_id;
                      return (
                        <button
                          type="button"
                          key={inv.investment_id}
                          onClick={() => setAddTarget(inv.investment_id)}
                          className={`w-full text-left p-3 border rounded-lg transition-colors ${
                            isSelected
                              ? "bg-amber-50 border-amber-400"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(Number(inv.total_amount))}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created {new Date(inv.created_at).toLocaleDateString("en-IN")}
                            {" · "}
                            {inv.transaction_count} txn{inv.transaction_count === 1 ? "" : "s"}
                          </p>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => { setAddTarget("new"); setAddTxType("add"); }}
                      className={`w-full p-3 border-2 border-dashed rounded-lg text-sm font-bold transition-colors ${
                        addTarget === "new"
                          ? "border-[#05CE78] bg-[#05CE78]/10 text-[#05CE78]"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      + Create as Separate Investment
                    </button>
                  </div>
                </div>
              )}

              {/* Type toggle - only relevant when topping up an existing investment */}
              {existingInPool.length > 0 && addTarget !== "new" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Type *</label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-bold">
                    <button type="button" onClick={() => setAddTxType("add")}
                      className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${addTxType === "add" ? "bg-[#05CE78] text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                      <ArrowDownCircle className="w-4 h-4" /> Add
                    </button>
                    <button type="button" onClick={() => setAddTxType("withdrawal")}
                      className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${addTxType === "withdrawal" ? "bg-red-500 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                      <ArrowUpCircle className="w-4 h-4" /> Withdrawal
                    </button>
                  </div>
                </div>
              )}

              {/* Amount + Date - placed AFTER target picker so the flow reads top-to-bottom like multi-step */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    <IndianRupee className="w-3 h-3 inline mr-1" /> Amount *
                  </label>
                  <input type="number" value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="500000" required min={1}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
                  {addForm.amount && <p className="text-xs text-gray-400 mt-1">{formatCurrency(Number(addForm.amount))}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" /> Date *
                  </label>
                  <input type="date" value={addForm.investedDate} onChange={e => setAddForm(f => ({ ...f, investedDate: e.target.value }))} required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  <FileText className="w-3 h-3 inline mr-1" /> Remarks
                </label>
                <input type="text" value={addForm.remarks} onChange={e => setAddForm(f => ({ ...f, remarks: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} disabled={addSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={addSubmitting || !addForm.investorId || !addForm.amount || (!addForm.poolId && !addForm.companyName)}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {addSubmitting
                    ? (<><Loader2 className="w-4 h-4 animate-spin" /> {addTarget !== "new" ? "Adding to existing..." : "Adding..."}</>)
                    : (addTarget !== "new" ? "Add to Existing" : "Add Investment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RECORD TRANSACTION MODAL ── */}
      {txTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !txSubmitting && setTxTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Record Transaction</h3>
                <p className="text-xs text-gray-400 mt-0.5">{txTarget.investor_name} · {txTarget.name}</p>
              </div>
              <button onClick={() => setTxTarget(null)} disabled={txSubmitting} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTxSubmit} className="p-6 space-y-5">
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Type *</label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-bold">
                  <button type="button" onClick={() => setTxForm(f => ({ ...f, transactionType: "add" }))}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${txForm.transactionType === "add" ? "bg-[#05CE78] text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                    <ArrowDownCircle className="w-4 h-4" /> Add Funds
                  </button>
                  <button type="button" onClick={() => setTxForm(f => ({ ...f, transactionType: "withdrawal" }))}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${txForm.transactionType === "withdrawal" ? "bg-red-500 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                    <ArrowUpCircle className="w-4 h-4" /> Withdrawal
                  </button>
                </div>
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    <IndianRupee className="w-3 h-3 inline mr-1" /> Amount *
                  </label>
                  <input type="number" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="100000" required min={1}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
                  {txForm.amount && <p className="text-xs text-gray-400 mt-1">{formatCurrency(Number(txForm.amount))}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" /> Date *
                  </label>
                  <input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  <FileText className="w-3 h-3 inline mr-1" /> Remarks
                </label>
                <input type="text" value={txForm.remarks} onChange={e => setTxForm(f => ({ ...f, remarks: e.target.value }))}
                  placeholder="e.g. Top-up for Pool 6 expansion"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
              </div>

              {/* Receipt URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  <Receipt className="w-3 h-3 inline mr-1" /> Receipt URL
                </label>
                <input type="url" value={txForm.receiptUrl} onChange={e => setTxForm(f => ({ ...f, receiptUrl: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setTxTarget(null)} disabled={txSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={txSubmitting || !txForm.amount}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {txSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording...</>
                    : txForm.transactionType === "add"
                      ? <><ArrowDownCircle className="w-4 h-4" /> Record Add</>
                      : <><ArrowUpCircle className="w-4 h-4" /> Record Withdrawal</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW DETAIL MODAL ── */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Investment Details</h3>
                <p className="text-xs text-gray-400 mt-0.5">{viewTarget.investor_name} · {viewTarget.name}</p>
              </div>
              <button onClick={() => setViewTarget(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* IDs - copyable */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Record IDs</p>
                <div className="space-y-2">
                  {[
                    { label: "Investment ID", value: viewTarget.investment_id, key: "investment_id" },
                    { label: "Investor ID",   value: viewTarget.investor_id,   key: "investor_id"   },
                    { label: "User ID",        value: viewTarget.user_id,       key: "user_id"       },
                    ...(viewTarget.pool_id ? [{ label: "Pool ID", value: viewTarget.pool_id, key: "pool_id" }] : []),
                  ].map(({ label, value, key }) => (
                    <div key={key} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">{label}</p>
                        <p className="text-xs font-mono text-gray-800 truncate mt-0.5">{value || "-"}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(value, key)}
                        className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Copy"
                      >
                        {copiedField === key
                          ? <Check className="w-3.5 h-3.5 text-green-500" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investment details */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Investment</p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-gray-500">Asset name</span>
                    <span className="font-medium text-gray-800">{viewTarget.name}</span>
                  </div>
                  {viewTarget.pool_name && (
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-gray-500">Pool</span>
                      <span className="font-medium text-gray-800">{viewTarget.pool_name}</span>
                    </div>
                  )}
                  {viewTarget.company_name && (
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-gray-500">Company name</span>
                      <span className="font-medium text-gray-800">{viewTarget.company_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-gray-900">{formatCurrency(viewTarget.total_amount)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-gray-500">Invested on</span>
                    <span className="font-medium text-gray-800">
                      {new Date(viewTarget.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-gray-500">Capital transactions</span>
                    <span className="font-medium text-gray-800">{viewTarget.transaction_count}</span>
                  </div>
                </div>
                {viewTarget.agreement_url && (
                  <a href={viewTarget.agreement_url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-colors">
                    <ExternalLink className="w-4 h-4" /> View Investment Agreement
                  </a>
                )}
              </div>

              {/* Investor details */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Investor</p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-800">{viewTarget.investor_name}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-800">{viewTarget.email}</span>
                  </div>
                </div>
              </div>

              {/* Payouts */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payouts</p>
                {viewPayoutsLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
                ) : viewPayouts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-5 bg-gray-50 border border-gray-100 rounded-xl">No payouts recorded yet.</p>
                ) : (() => {
                  const totalGross = viewPayouts.reduce((s, p) => s + Number(p.gross_roi_amount), 0);
                  const totalNet = viewPayouts.reduce((s, p) => s + Number(p.net_payable_amount), 0);
                  const totalTds = viewPayouts.reduce((s, p) => s + Number(p.tds_deduction), 0);
                  const totalEf = viewPayouts.reduce((s, p) => s + Number(p.emergency_fund_deduction), 0);
                  const invested = Number(viewTarget!.total_amount);
                  const returnedPct = invested > 0 ? Math.min(100, (totalNet / invested) * 100) : 0;
                  return (
                    <>
                      {/* Summary cards */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-emerald-600 font-semibold">Total Gross</p>
                          <p className="text-sm font-black text-emerald-700 mt-0.5">{formatCurrency(totalGross)}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-blue-600 font-semibold">Net Paid Out</p>
                          <p className="text-sm font-black text-blue-700 mt-0.5">{formatCurrency(totalNet)}</p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-red-500 font-semibold">TDS Deducted</p>
                          <p className="text-sm font-black text-red-600 mt-0.5">{formatCurrency(totalTds)}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-amber-600 font-semibold">Emergency Fund</p>
                          <p className="text-sm font-black text-amber-700 mt-0.5">{formatCurrency(totalEf)}</p>
                        </div>
                      </div>

                      {/* Capital returned bar - only show when investment is still active */}
                      {invested > 0 && <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-600">Capital Returned via Payouts</span>
                          <span className="text-xs font-black text-gray-800">{returnedPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${returnedPct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {formatCurrency(totalNet)} of {formatCurrency(invested)} invested
                        </p>
                      </div>}

                      {/* Per-payout rows */}
                      <div className="space-y-2">
                        {viewPayouts.map(p => (
                          <div key={p.payment_id} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                                {p.quarter_year}
                                {p.months_considered && <span className="text-gray-400 font-normal">· {p.months_considered}m</span>}
                                {(() => {
                                  const roi = p.roi_percentage != null
                                    ? p.roi_percentage
                                    : (p.gross_roi_amount && invested && p.months_considered)
                                      ? (Number(p.gross_roi_amount) / invested) * (12 / p.months_considered) * 100
                                      : null;
                                  return roi != null ? (
                                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">
                                      {roi.toFixed(1)}% ROI{p.roi_percentage == null ? "*" : ""}
                                    </span>
                                  ) : null;
                                })()}
                              </span>
                              {p.payment_date && (
                                <span className="text-xs text-gray-400">
                                  {new Date(p.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div>
                                <p className="text-gray-400 mb-0.5">Gross</p>
                                <p className="font-bold text-gray-800">{formatCurrency(p.gross_roi_amount)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">TDS</p>
                                <p className="font-bold text-red-600">-{formatCurrency(p.tds_deduction)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">EF</p>
                                <p className="font-bold text-amber-600">-{formatCurrency(p.emergency_fund_deduction)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Net</p>
                                <p className="font-bold text-emerald-700">{formatCurrency(p.net_payable_amount)}</p>
                              </div>
                            </div>
                            {(p.payment_reference || p.receipt_url) && (
                              <div className="flex items-center justify-between mt-1.5">
                                {p.payment_reference && <p className="text-xs text-gray-400">Ref: {p.payment_reference}</p>}
                                {p.receipt_url && (
                                  <a href={p.receipt_url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors ml-auto">
                                    <ExternalLink className="w-3 h-3" /> Receipt
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Capital transactions */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Capital Transactions</p>
                {viewTxLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                  </div>
                ) : viewTransactions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-5 bg-gray-50 border border-gray-100 rounded-xl">No transactions recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {viewTransactions.map(tx => (
                      <div key={tx.transaction_id} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 group/tx">
                        <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${tx.transaction_type === "add" ? "bg-green-100" : "bg-red-100"}`}>
                          {tx.transaction_type === "add"
                            ? <ArrowDownCircle className="w-3.5 h-3.5 text-green-600" />
                            : <ArrowUpCircle className="w-3.5 h-3.5 text-red-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-bold ${tx.transaction_type === "add" ? "text-green-700" : "text-red-600"}`}>
                              {tx.transaction_type === "add" ? "+" : "−"}{formatCurrency(tx.investment_amount)}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-gray-400">
                                {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <button
                                onClick={() => handleDeleteTx(tx.transaction_id)}
                                disabled={deletingTxId === tx.transaction_id}
                                className="opacity-0 group-hover/tx:opacity-100 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                title="Delete transaction"
                              >
                                {deletingTxId === tx.transaction_id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />
                                }
                              </button>
                            </div>
                          </div>
                          {tx.remarks && <p className="text-xs text-gray-500 mt-0.5 truncate">{tx.remarks}</p>}
                          {tx.receipt_url && (
                            <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 transition-colors">
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
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Delete Investment</h3>
                <p className="text-gray-500 text-sm mt-1">
                  This will permanently delete the investment record and all its capital transactions.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-1 border border-gray-100">
              <p><span className="text-gray-400">Investor:</span> <span className="font-medium text-gray-700">{deleteTarget.investor_name}</span></p>
              <p><span className="text-gray-400">Asset:</span> <span className="font-medium text-gray-700">{deleteTarget.name}</span></p>
              <p><span className="text-gray-400">Amount:</span> <span className="font-medium text-gray-700">{formatCurrency(deleteTarget.total_amount)}</span></p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-red-900/20">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
