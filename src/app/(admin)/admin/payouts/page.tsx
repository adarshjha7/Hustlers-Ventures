"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wallet, Plus, CheckCircle2, AlertCircle, Loader2, IndianRupee,
  Calendar, X, Trash2, Search, Clock, BadgeCheck, Percent,
  Receipt, FileText, CreditCard, ChevronDown, ChevronUp, Download, Pencil, ListChecks,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { logEvent } from "@/lib/logger";
import { exportToCsv } from "@/lib/exportCsv";
import { SortIcon } from "@/components/admin/SortIcon";
import { buildPaginationPages } from "@/lib/paginationHelper";
import { useToast } from "@/hooks/useToast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Payout {
  payment_id: string;
  investment_id: string;
  declaration_id: string;
  gross_roi_amount: number;
  emergency_fund_deduction: number;
  tds_deduction: number;
  net_payable_amount: number;
  payment_date: string | null;
  payment_reference: string | null;
  receipt_url: string | null;
  remarks: string | null;
  fd_returns: number | null;
  months_considered: number | null;
  is_tds_filed: boolean;
  created_at: string;
  investor_name: string;
  email: string;
  asset_name: string;
  quarter_year: string;
  pool_name: string;
}

interface Investment {
  investment_id: string;
  investor_name: string;
  email: string;
  name: string;
}

interface Declaration {
  declaration_id: string;
  quarter_year: string;
  pool_name: string;
  roi_percentage: number;
  declaration_date: string;
  month_names: string | null;
  emergency_fund_deduction_amount: number | null;
  purchase_id: string;
  is_finalized: boolean;
}

interface Pool {
  purchase_id: string;
  pool_name: string;
}

const emptyAddForm = {
  investmentId: "",
  declarationId: "",
  grossAmount: "",
  emergencyFund: "0",
  tds: "0",
  monthsConsidered: "",
  fdReturns: "",
  paymentDate: "",
  paymentReference: "",
  receiptUrl: "",
  remarks: "",
  isTdsFiled: false,
};

const emptyDeclForm = {
  poolId: "",
  quarterYear: "",
  roiPercentage: "",
  declarationDate: new Date().toISOString().split("T")[0],
  monthNames: "",
  emergencyFundAmount: "",
};

const emptyMarkPaidForm = {
  paymentDate: new Date().toISOString().split("T")[0],
  paymentReference: "",
  receiptUrl: "",
  isTdsFiled: false,
};

const PAGE_SIZE = 15;

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [quarterFilter, setQuarterFilter] = useState("");
  const [page, setPage] = useState(1);
  const { toast: status, showToast, clearToast } = useToast();
  const [activeTab, setActiveTab] = useState<"payouts" | "declarations">("payouts");

  // Add payout modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Inline new declaration (inside add payout modal)
  const [showDeclForm, setShowDeclForm] = useState(false);
  const [declForm, setDeclForm] = useState(emptyDeclForm);
  const [declSubmitting, setDeclSubmitting] = useState(false);

  // Standalone new declaration modal (from declarations tab)
  const [showNewDeclModal, setShowNewDeclModal] = useState(false);

  // Edit payout modal
  const [editTarget, setEditTarget] = useState<Payout | null>(null);
  const [editForm, setEditForm] = useState(emptyAddForm);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Mark as paid modal
  const [markPaidTarget, setMarkPaidTarget] = useState<Payout | null>(null);
  const [markPaidForm, setMarkPaidForm] = useState(emptyMarkPaidForm);
  const [markPaidSubmitting, setMarkPaidSubmitting] = useState(false);

  // Delete payout modal
  const [deleteTarget, setDeleteTarget] = useState<Payout | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Declarations sort
  const [declSortKey, setDeclSortKey] = useState<"pool_name" | "quarter_year" | "roi_percentage" | "declaration_date">("declaration_date");
  const [declSortDir, setDeclSortDir] = useState<"asc" | "desc">("desc");

  const handleDeclSort = (key: typeof declSortKey) => {
    if (declSortKey === key) setDeclSortDir(d => d === "asc" ? "desc" : "asc");
    else { setDeclSortKey(key); setDeclSortDir(key === "roi_percentage" || key === "declaration_date" ? "desc" : "asc"); }
  };

  const sortedDeclarations = useMemo(() => [...declarations].sort((a, b) => {
    const av = a[declSortKey] ?? "";
    const bv = b[declSortKey] ?? "";
    const cmp = typeof av === "number" ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
    return declSortDir === "asc" ? cmp : -cmp;
  }), [declarations, declSortKey, declSortDir]);

  // Edit declaration modal
  const [editDeclTarget, setEditDeclTarget] = useState<Declaration | null>(null);
  const [editDeclForm, setEditDeclForm] = useState(emptyDeclForm);
  const [editDeclSubmitting, setEditDeclSubmitting] = useState(false);

  // Delete declaration modal
  const [deleteDeclTarget, setDeleteDeclTarget] = useState<Declaration | null>(null);
  const [deletingDecl, setDeletingDecl] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [payoutsRes, investmentsRes, declarationsRes, poolsRes] = await Promise.all([
      fetch("/api/admin/payouts").then(r => r.json()),
      fetch("/api/admin/investments").then(r => r.json()),
      fetch("/api/admin/declarations").then(r => r.json()),
      fetch("/api/admin/pools").then(r => r.json()),
    ]);
    setPayouts(payoutsRes.payouts ?? []);
    setInvestments(investmentsRes.investments ?? []);
    setDeclarations(declarationsRes.declarations ?? []);
    setPools(poolsRes.pools ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Derived ─────────────────────────────────────────────────────────────

  const computedNet = useMemo(() => {
    const gross = Number(addForm.grossAmount) || 0;
    const ef = Number(addForm.emergencyFund) || 0;
    const tds = Number(addForm.tds) || 0;
    return Math.max(0, gross - ef - tds);
  }, [addForm.grossAmount, addForm.emergencyFund, addForm.tds]);

  const computedEditNet = useMemo(() => {
    const gross = Number(editForm.grossAmount) || 0;
    const ef = Number(editForm.emergencyFund) || 0;
    const tds = Number(editForm.tds) || 0;
    return Math.max(0, gross - ef - tds);
  }, [editForm.grossAmount, editForm.emergencyFund, editForm.tds]);

  const paidPayouts    = payouts.filter(p => p.payment_date);
  const pendingPayouts = payouts.filter(p => !p.payment_date);
  const totalPaid    = paidPayouts.reduce((s, p) => s + Number(p.net_payable_amount), 0);
  const totalPending = pendingPayouts.reduce((s, p) => s + Number(p.net_payable_amount), 0);
  const efCollected  = paidPayouts.reduce((s, p) => s + Number(p.emergency_fund_deduction ?? 0), 0);
  const efPending    = pendingPayouts.reduce((s, p) => s + Number(p.emergency_fund_deduction ?? 0), 0);

  const quarters = useMemo(() =>
    [...new Set(declarations.map(d => d.quarter_year))].sort().reverse(),
    [declarations]
  );

  const q = search.toLowerCase();
  const filtered = payouts.filter(p => {
    const matchesSearch = !q ||
      p.investor_name.toLowerCase().includes(q) ||
      p.asset_name.toLowerCase().includes(q) ||
      p.quarter_year.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && !!p.payment_date) ||
      (statusFilter === "pending" && !p.payment_date);
    const matchesQuarter = !quarterFilter || p.quarter_year === quarterFilter;
    return matchesSearch && matchesStatus && matchesQuarter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const paginationPages = buildPaginationPages(page, totalPages);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    const res = await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        investmentId: addForm.investmentId,
        declarationId: addForm.declarationId,
        grossAmount: addForm.grossAmount,
        emergencyFund: addForm.emergencyFund,
        tds: addForm.tds,
        netAmount: computedNet,
        paymentDate: addForm.paymentDate || null,
        paymentReference: addForm.paymentReference || null,
        receiptUrl: addForm.receiptUrl || null,
        remarks: addForm.remarks || null,
        fdReturns: addForm.fdReturns || null,
        monthsConsidered: addForm.monthsConsidered || null,
        isTdsFiled: addForm.isTdsFiled,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      const inv = investments.find(i => i.investment_id === addForm.investmentId);
      const decl = declarations.find(d => d.declaration_id === addForm.declarationId);
      showToast("success", `Payout of ${formatCurrency(computedNet)} recorded for ${inv?.investor_name} · ${decl?.quarter_year}.`);
      logEvent("INFO", "Admin recorded payout", { investmentId: addForm.investmentId, declarationId: addForm.declarationId, net: computedNet }).catch(console.error);
      setAddForm(emptyAddForm);
      setShowAddModal(false);
      setShowDeclForm(false);
      fetchAll();
    }
    setAddSubmitting(false);
  };

  const handleCreateDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeclSubmitting(true);
    const res = await fetch("/api/admin/declarations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poolId: declForm.poolId,
        quarterYear: declForm.quarterYear,
        roiPercentage: declForm.roiPercentage,
        declarationDate: declForm.declarationDate,
        monthNames: declForm.monthNames || null,
        emergencyFundAmount: declForm.emergencyFundAmount || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      logEvent("INFO", "Admin created declaration", { quarterYear: declForm.quarterYear, poolId: declForm.poolId }).catch(console.error);
      const declRes = await fetch("/api/admin/declarations").then(r => r.json());
      setDeclarations(declRes.declarations ?? []);
      // Auto-select only when creating inline inside the add-payout modal
      if (!showNewDeclModal) {
        setAddForm(f => ({ ...f, declarationId: data.declarationId }));
      }
      setDeclForm(emptyDeclForm);
      setShowDeclForm(false);
      setShowNewDeclModal(false);
      showToast("success", `Declaration "${declForm.quarterYear}" created.`);
    }
    setDeclSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSubmitting(true);
    const res = await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentId: editTarget.payment_id,
        investmentId: editForm.investmentId,
        declarationId: editForm.declarationId,
        grossAmount: editForm.grossAmount,
        emergencyFund: editForm.emergencyFund,
        tds: editForm.tds,
        netAmount: computedEditNet,
        paymentDate: editForm.paymentDate || null,
        paymentReference: editForm.paymentReference || null,
        receiptUrl: editForm.receiptUrl || null,
        remarks: editForm.remarks || null,
        fdReturns: editForm.fdReturns || null,
        monthsConsidered: editForm.monthsConsidered || null,
        isTdsFiled: editForm.isTdsFiled,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      showToast("success", `Payout updated for ${editTarget.investor_name}.`);
      logEvent("INFO", "Admin edited payout", { paymentId: editTarget.payment_id }).catch(console.error);
      setEditTarget(null);
      fetchAll();
    }
    setEditSubmitting(false);
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markPaidTarget) return;
    setMarkPaidSubmitting(true);
    const res = await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentId: markPaidTarget.payment_id,
        paymentDate: markPaidForm.paymentDate,
        paymentReference: markPaidForm.paymentReference || null,
        receiptUrl: markPaidForm.receiptUrl || null,
        isTdsFiled: markPaidForm.isTdsFiled,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      showToast("success", `Payout marked as paid for ${markPaidTarget.investor_name}.`);
      logEvent("INFO", "Admin marked payout as paid", { paymentId: markPaidTarget.payment_id, date: markPaidForm.paymentDate }).catch(console.error);
      setMarkPaidTarget(null);
      fetchAll();
    }
    setMarkPaidSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/payouts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: deleteTarget.payment_id }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      setPayouts(prev => prev.filter(p => p.payment_id !== deleteTarget.payment_id));
      showToast("success", `Payout for ${deleteTarget.investor_name} deleted.`);
      logEvent("WARN", "Admin deleted payout", { paymentId: deleteTarget.payment_id, investorName: deleteTarget.investor_name }).catch(console.error);
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleEditDeclSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDeclTarget) return;
    setEditDeclSubmitting(true);
    const res = await fetch("/api/admin/declarations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        declarationId: editDeclTarget.declaration_id,
        poolId: editDeclForm.poolId,
        quarterYear: editDeclForm.quarterYear,
        roiPercentage: editDeclForm.roiPercentage,
        declarationDate: editDeclForm.declarationDate,
        monthNames: editDeclForm.monthNames || null,
        emergencyFundAmount: editDeclForm.emergencyFundAmount || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      showToast("success", `Declaration "${editDeclForm.quarterYear}" updated.`);
      logEvent("INFO", "Admin edited declaration", { declarationId: editDeclTarget.declaration_id }).catch(console.error);
      setEditDeclTarget(null);
      fetchAll();
    }
    setEditDeclSubmitting(false);
  };

  const handleDeleteDecl = async () => {
    if (!deleteDeclTarget) return;
    setDeletingDecl(true);
    const res = await fetch("/api/admin/declarations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ declarationId: deleteDeclTarget.declaration_id }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      setDeclarations(prev => prev.filter(d => d.declaration_id !== deleteDeclTarget.declaration_id));
      showToast("success", `Declaration "${deleteDeclTarget.quarter_year}" deleted.`);
      logEvent("WARN", "Admin deleted declaration", { declarationId: deleteDeclTarget.declaration_id }).catch(console.error);
    }
    setDeleteDeclTarget(null);
    setDeletingDecl(false);
  };

  // Shared declaration form JSX (used in add-payout inline form, standalone new-decl modal, and edit-decl modal)
  const DeclFormFields = ({ form, onChange, submitLabel, onSubmit, submitting }: {
    form: typeof emptyDeclForm;
    onChange: (f: typeof emptyDeclForm) => void;
    submitLabel: string;
    onSubmit: (e: React.FormEvent) => void;
    submitting: boolean;
  }) => (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Pool *</label>
        <select value={form.poolId} onChange={e => onChange({ ...form, poolId: e.target.value })} required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#05CE78]">
          <option value="">- Select pool -</option>
          {pools.map(p => <option key={p.purchase_id} value={p.purchase_id}>{p.pool_name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Quarter Year *</label>
          <input type="text" value={form.quarterYear} onChange={e => onChange({ ...form, quarterYear: e.target.value })} required
            placeholder="Q4 FY2024-25"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#05CE78]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">ROI % *</label>
          <input type="number" value={form.roiPercentage} onChange={e => onChange({ ...form, roiPercentage: e.target.value })} required
            placeholder="4.5" step="0.01"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#05CE78]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Declaration Date *</label>
          <input type="date" value={form.declarationDate} onChange={e => onChange({ ...form, declarationDate: e.target.value })} required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#05CE78]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Month Names</label>
          <input type="text" value={form.monthNames} onChange={e => onChange({ ...form, monthNames: e.target.value })}
            placeholder="Jan, Feb, Mar"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#05CE78]" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">EF Deduction Amount</label>
        <input type="number" value={form.emergencyFundAmount} onChange={e => onChange({ ...form, emergencyFundAmount: e.target.value })}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#05CE78]" />
      </div>
      <button type="submit"
        disabled={submitting || !form.poolId || !form.quarterYear || !form.roiPercentage || !form.declarationDate}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : submitLabel}
      </button>
    </form>
  );

  // Shared payout form fields JSX
  const PayoutFormFields = ({ form, onChange, computedNetAmt }: {
    form: typeof emptyAddForm;
    onChange: (f: typeof emptyAddForm) => void;
    computedNetAmt: number;
  }) => (
    <>
      {/* Investment */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Investment *</label>
        <select value={form.investmentId} onChange={e => onChange({ ...form, investmentId: e.target.value })} required
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm">
          <option value="">- Select investor & asset -</option>
          {investments.map(inv => (
            <option key={inv.investment_id} value={inv.investment_id}>
              {inv.investor_name} · {inv.name}
            </option>
          ))}
        </select>
      </div>

      {/* Declaration */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Quarter Declaration *</label>
        <select value={form.declarationId} onChange={e => onChange({ ...form, declarationId: e.target.value })} required
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm">
          <option value="">- Select quarter -</option>
          {declarations.map(d => (
            <option key={d.declaration_id} value={d.declaration_id}>
              {d.quarter_year} · {d.pool_name}
            </option>
          ))}
        </select>
      </div>

      {/* Amounts */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Amounts</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              <IndianRupee className="w-3 h-3 inline mr-0.5" /> Gross ROI *
            </label>
            <input type="number" value={form.grossAmount} onChange={e => onChange({ ...form, grossAmount: e.target.value })}
              placeholder="25000" required min={0} step="0.01"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Emergency Fund Deduction</label>
            <input type="number" value={form.emergencyFund} onChange={e => onChange({ ...form, emergencyFund: e.target.value })}
              placeholder="0" min={0} step="0.01"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">TDS Deduction</label>
            <input type="number" value={form.tds} onChange={e => onChange({ ...form, tds: e.target.value })}
              placeholder="0" min={0} step="0.01"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Net Payable</label>
            <div className="w-full px-4 py-2.5 border border-gray-100 rounded-xl bg-green-50 text-green-700 font-bold text-sm">
              {formatCurrency(computedNetAmt)}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Months Considered</label>
            <input type="number" value={form.monthsConsidered} onChange={e => onChange({ ...form, monthsConsidered: e.target.value })}
              placeholder="3" min={1} max={12}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">FD Returns</label>
            <input type="number" value={form.fdReturns} onChange={e => onChange({ ...form, fdReturns: e.target.value })}
              placeholder="0" min={0} step="0.01"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
          </div>
        </div>
      </div>

      {/* Payment details */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Details <span className="normal-case font-normal">(leave date blank to keep Pending)</span></p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-0.5" /> Payment Date
              </label>
              <input type="date" value={form.paymentDate} onChange={e => onChange({ ...form, paymentDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                <CreditCard className="w-3 h-3 inline mr-0.5" /> Reference
              </label>
              <input type="text" value={form.paymentReference} onChange={e => onChange({ ...form, paymentReference: e.target.value })}
                placeholder="UTR / Txn ID"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              <Receipt className="w-3 h-3 inline mr-0.5" /> Receipt URL
            </label>
            <input type="url" value={form.receiptUrl} onChange={e => onChange({ ...form, receiptUrl: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              <FileText className="w-3 h-3 inline mr-0.5" /> Remarks
            </label>
            <input type="text" value={form.remarks} onChange={e => onChange({ ...form, remarks: e.target.value })}
              placeholder="Any notes..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative" onClick={() => onChange({ ...form, isTdsFiled: !form.isTdsFiled })}>
              <div className={`w-10 h-6 rounded-full transition-colors ${form.isTdsFiled ? "bg-[#05CE78]" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow mt-1 transition-transform ${form.isTdsFiled ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">TDS Filed</p>
              <p className="text-xs text-gray-400">Mark if TDS has been filed with income tax</p>
            </div>
          </label>
        </div>
      </div>
    </>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#05CE78]" /> Payouts
          </h1>
          <p className="text-sm text-gray-500 mt-1">{payouts.length} records · {declarations.length} declarations</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "payouts" && (
            <>
              <button
                onClick={() => exportToCsv(`payouts-${new Date().toISOString().split("T")[0]}.csv`, filtered, [
                  { key: "investor_name",            label: "Investor" },
                  { key: "email",                    label: "Email" },
                  { key: "asset_name",               label: "Asset" },
                  { key: "quarter_year",             label: "Quarter" },
                  { key: "gross_roi_amount",         label: "Gross ROI" },
                  { key: "emergency_fund_deduction", label: "Emergency Fund Deduction" },
                  { key: "tds_deduction",            label: "TDS Deduction" },
                  { key: "net_payable_amount",       label: "Net Payable" },
                  { key: "payment_date",             label: "Payment Date" },
                  { key: "payment_reference",        label: "Reference" },
                  { key: "is_tds_filed",             label: "TDS Filed" },
                ])}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              <button
                onClick={() => { setShowAddModal(true); clearToast(); }}
                className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b067] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-900/20 text-sm"
              >
                <Plus className="w-4 h-4" /> Record Payout
              </button>
            </>
          )}
          {activeTab === "declarations" && (
            <button
              onClick={() => { setDeclForm(emptyDeclForm); setShowNewDeclModal(true); clearToast(); }}
              className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b067] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-900/20 text-sm"
            >
              <Plus className="w-4 h-4" /> New Declaration
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("payouts")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${activeTab === "payouts" ? "border-[#05CE78] text-[#05CE78]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
        >
          <Wallet className="w-3.5 h-3.5" /> Payouts
        </button>
        <button
          onClick={() => setActiveTab("declarations")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${activeTab === "declarations" ? "border-[#05CE78] text-[#05CE78]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
        >
          <Percent className="w-3.5 h-3.5" /> Declarations
        </button>
      </div>

      {/* Status banner */}
      {status && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${status.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
          {status.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {status.message}
          <button onClick={() => clearToast()} className="ml-auto opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── PAYOUTS TAB ── */}
      {activeTab === "payouts" && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 border-t-4 border-t-green-400">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Paid</p>
              <p className="text-xl font-extrabold text-gray-900">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-gray-400 mt-1">{paidPayouts.length} payouts</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 border-t-4 border-t-amber-400">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending</p>
              <p className="text-xl font-extrabold text-gray-900">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-gray-400 mt-1">{pendingPayouts.length} payouts</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 border-t-4 border-t-blue-400">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Disbursed</p>
              <p className="text-xl font-extrabold text-gray-900">{formatCurrency(totalPaid + totalPending)}</p>
              <p className="text-xs text-gray-400 mt-1">{payouts.length} total records</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 border-t-4 border-t-orange-400">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Emergency Fund</p>
              <p className="text-xl font-extrabold text-orange-600">{formatCurrency(efCollected)}</p>
              <p className="text-xs text-gray-400 mt-1">
                collected
                {efPending > 0 && <span className="ml-1 text-orange-400">· {formatCurrency(efPending)} pending</span>}
              </p>
            </div>
          </div>

          {/* Payouts table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {(["all", "paid", "pending"] as const).map(f => (
                  <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors capitalize ${statusFilter === f ? "bg-[#0B1120] text-white border-[#0B1120]" : "text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900"}`}>
                    {f}
                  </button>
                ))}
                {quarters.length > 0 && (
                  <select
                    value={quarterFilter}
                    onChange={e => { setQuarterFilter(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors bg-white text-gray-500 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#05CE78] cursor-pointer"
                  >
                    <option value="">All Quarters</option>
                    {quarters.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search investor, asset or quarter..."
                  className="pl-9 py-2 pr-4 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-72"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                {search || statusFilter !== "all" ? "No payouts match your filter." : "No payouts recorded yet."}
              </div>
            ) : (
              <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[24%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[16%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Investor</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset / Quarter</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Gross</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Net</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map(p => (
                      <tr key={p.payment_id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 truncate">{p.investor_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{p.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700 font-medium truncate">{p.asset_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.quarter_year}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 tabular-nums">
                          {formatCurrency(p.gross_roi_amount)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 tabular-nums">
                          {formatCurrency(p.net_payable_amount)}
                        </td>
                        <td className="px-6 py-4">
                          {p.payment_date ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-100">
                                <BadgeCheck className="w-3 h-3" /> Paid
                              </span>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(p.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-100">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => {
                                setEditTarget(p);
                                setEditForm({
                                  investmentId: p.investment_id,
                                  declarationId: p.declaration_id,
                                  grossAmount: String(p.gross_roi_amount),
                                  emergencyFund: String(p.emergency_fund_deduction),
                                  tds: String(p.tds_deduction),
                                  monthsConsidered: p.months_considered ? String(p.months_considered) : "",
                                  fdReturns: p.fd_returns ? String(p.fd_returns) : "",
                                  paymentDate: p.payment_date ?? "",
                                  paymentReference: p.payment_reference ?? "",
                                  receiptUrl: p.receipt_url ?? "",
                                  remarks: p.remarks ?? "",
                                  isTdsFiled: p.is_tds_filed,
                                });
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit payout"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {!p.payment_date && (
                              <button
                                onClick={() => { setMarkPaidTarget(p); setMarkPaidForm(emptyMarkPaidForm); }}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-gray-500 border border-gray-200 rounded-lg hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                title="Mark as paid"
                              >
                                <BadgeCheck className="w-3.5 h-3.5" /> Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete payout"
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
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-gray-600">{filtered.length}</span>
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
        </>
      )}

      {/* ── DECLARATIONS TAB ── */}
      {activeTab === "declarations" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
          ) : declarations.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No declarations yet. Create one to start recording payouts.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {([
                      { key: "pool_name",        label: "Pool",    align: "left" },
                      { key: "quarter_year",     label: "Quarter", align: "left" },
                      { key: "roi_percentage",   label: "ROI %",   align: "right" },
                      { key: "declaration_date", label: "Date",    align: "left" },
                    ] as { key: typeof declSortKey; label: string; align: string }[]).map(col => {
                      return (
                        <th key={col.key} onClick={() => handleDeclSort(col.key)}
                          className={`px-6 py-3 text-${col.align} text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900`}>
                          <span className={`flex items-center gap-1 ${col.align === "right" ? "justify-end" : ""}`}>
                            {col.label}
                            <SortIcon column={col.key} sortKey={declSortKey} sortDir={declSortDir} />
                          </span>
                        </th>
                      );
                    })}
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Months</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">EF Deduction</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedDeclarations.map(d => (
                    <tr key={d.declaration_id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-gray-900">{d.pool_name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-100">
                          {d.quarter_year}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums font-semibold text-gray-700">{d.roi_percentage}%</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(d.declaration_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{d.month_names || "-"}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-gray-600">
                        {d.emergency_fund_deduction_amount ? formatCurrency(d.emergency_fund_deduction_amount) : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setEditDeclTarget(d);
                              setEditDeclForm({
                                poolId: d.purchase_id,
                                quarterYear: d.quarter_year,
                                roiPercentage: String(d.roi_percentage),
                                declarationDate: d.declaration_date,
                                monthNames: d.month_names ?? "",
                                emergencyFundAmount: d.emergency_fund_deduction_amount ? String(d.emergency_fund_deduction_amount) : "",
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit declaration"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDeclTarget(d)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete declaration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ADD PAYOUT MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !addSubmitting && setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Record Payout</h3>
                <p className="text-xs text-gray-400 mt-0.5">Record a quarterly ROI payment for an investor.</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setShowDeclForm(false); }} disabled={addSubmitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-5 overflow-y-auto">
              {/* Investment */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Investment *</label>
                <select value={addForm.investmentId} onChange={e => setAddForm(f => ({ ...f, investmentId: e.target.value }))} required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm">
                  <option value="">- Select investor & asset -</option>
                  {investments.map(inv => (
                    <option key={inv.investment_id} value={inv.investment_id}>
                      {inv.investor_name} · {inv.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Declaration with inline new-decl form */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Quarter Declaration *</label>
                  <button type="button" onClick={() => setShowDeclForm(v => !v)}
                    className="flex items-center gap-1 text-xs font-bold text-[#05CE78] hover:text-[#04b067] transition-colors">
                    {showDeclForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {showDeclForm ? "Cancel" : "New Declaration"}
                  </button>
                </div>
                <select value={addForm.declarationId} onChange={e => setAddForm(f => ({ ...f, declarationId: e.target.value }))} required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm">
                  <option value="">- Select quarter -</option>
                  {declarations.map(d => (
                    <option key={d.declaration_id} value={d.declaration_id}>
                      {d.quarter_year} · {d.pool_name}
                    </option>
                  ))}
                </select>

                {showDeclForm && (
                  <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">New Declaration</p>
                    <DeclFormFields
                      form={declForm}
                      onChange={setDeclForm}
                      submitLabel="Create Declaration"
                      onSubmit={handleCreateDeclaration}
                      submitting={declSubmitting}
                    />
                  </div>
                )}
              </div>

              {/* Rest of payout fields */}
              <PayoutFormFields form={addForm} onChange={setAddForm} computedNetAmt={computedNet} />

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowAddModal(false); setShowDeclForm(false); }} disabled={addSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={addSubmitting || !addForm.investmentId || !addForm.declarationId || !addForm.grossAmount}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {addSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording...</> : "Record Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT PAYOUT MODAL ── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !editSubmitting && setEditTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Edit Payout</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editTarget.investor_name} · {editTarget.quarter_year}</p>
              </div>
              <button onClick={() => setEditTarget(null)} disabled={editSubmitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 overflow-y-auto">
              <PayoutFormFields form={editForm} onChange={setEditForm} computedNetAmt={computedEditNet} />

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setEditTarget(null)} disabled={editSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting || !editForm.investmentId || !editForm.declarationId || !editForm.grossAmount}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {editSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Pencil className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MARK AS PAID MODAL ── */}
      {markPaidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !markPaidSubmitting && setMarkPaidTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Mark as Paid</h3>
                <p className="text-xs text-gray-400 mt-0.5">{markPaidTarget.investor_name} · {markPaidTarget.quarter_year} · {formatCurrency(markPaidTarget.net_payable_amount)}</p>
              </div>
              <button onClick={() => setMarkPaidTarget(null)} disabled={markPaidSubmitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleMarkPaid} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  <Calendar className="w-3 h-3 inline mr-1" /> Payment Date *
                </label>
                <input type="date" value={markPaidForm.paymentDate} onChange={e => setMarkPaidForm(f => ({ ...f, paymentDate: e.target.value }))} required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  <CreditCard className="w-3 h-3 inline mr-1" /> Reference
                </label>
                <input type="text" value={markPaidForm.paymentReference} onChange={e => setMarkPaidForm(f => ({ ...f, paymentReference: e.target.value }))}
                  placeholder="UTR / Transaction ID"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  <Receipt className="w-3 h-3 inline mr-1" /> Receipt URL
                </label>
                <input type="url" value={markPaidForm.receiptUrl} onChange={e => setMarkPaidForm(f => ({ ...f, receiptUrl: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative" onClick={() => setMarkPaidForm(f => ({ ...f, isTdsFiled: !f.isTdsFiled }))}>
                  <div className={`w-10 h-6 rounded-full transition-colors ${markPaidForm.isTdsFiled ? "bg-[#05CE78]" : "bg-gray-300"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow mt-1 transition-transform ${markPaidForm.isTdsFiled ? "translate-x-5" : "translate-x-1"}`} />
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">TDS Filed</p>
              </label>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setMarkPaidTarget(null)} disabled={markPaidSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={markPaidSubmitting || !markPaidForm.paymentDate}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b067] text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {markPaidSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><BadgeCheck className="w-4 h-4" /> Mark as Paid</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE PAYOUT MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Delete Payout</h3>
                <p className="text-gray-500 text-sm mt-1">This will permanently delete this payout record.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-1 border border-gray-100">
              <p><span className="text-gray-400">Investor:</span> <span className="font-medium text-gray-700">{deleteTarget.investor_name}</span></p>
              <p><span className="text-gray-400">Quarter:</span> <span className="font-medium text-gray-700">{deleteTarget.quarter_year}</span></p>
              <p><span className="text-gray-400">Net Amount:</span> <span className="font-medium text-gray-700">{formatCurrency(deleteTarget.net_payable_amount)}</span></p>
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

      {/* ── NEW DECLARATION MODAL (standalone) ── */}
      {showNewDeclModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !declSubmitting && setShowNewDeclModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">New Declaration</h3>
                <p className="text-xs text-gray-400 mt-0.5">Create a quarterly ROI declaration for a pool.</p>
              </div>
              <button onClick={() => setShowNewDeclModal(false)} disabled={declSubmitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <DeclFormFields
                form={declForm}
                onChange={setDeclForm}
                submitLabel="Create Declaration"
                onSubmit={handleCreateDeclaration}
                submitting={declSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT DECLARATION MODAL ── */}
      {editDeclTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !editDeclSubmitting && setEditDeclTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Edit Declaration</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editDeclTarget.quarter_year} · {editDeclTarget.pool_name}</p>
              </div>
              <button onClick={() => setEditDeclTarget(null)} disabled={editDeclSubmitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <DeclFormFields
                form={editDeclForm}
                onChange={setEditDeclForm}
                submitLabel="Save Changes"
                onSubmit={handleEditDeclSubmit}
                submitting={editDeclSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE DECLARATION MODAL ── */}
      {deleteDeclTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deletingDecl && setDeleteDeclTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Delete Declaration</h3>
                <p className="text-gray-500 text-sm mt-1">This will permanently delete this declaration. Associated payout records will remain but lose their declaration link.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-1 border border-gray-100">
              <p><span className="text-gray-400">Pool:</span> <span className="font-medium text-gray-700">{deleteDeclTarget.pool_name}</span></p>
              <p><span className="text-gray-400">Quarter:</span> <span className="font-medium text-gray-700">{deleteDeclTarget.quarter_year}</span></p>
              <p><span className="text-gray-400">ROI:</span> <span className="font-medium text-gray-700">{deleteDeclTarget.roi_percentage}%</span></p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteDeclTarget(null)} disabled={deletingDecl}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDeleteDecl} disabled={deletingDecl}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-red-900/20">
                {deletingDecl ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
