"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Layers, Plus, CheckCircle2, AlertCircle, Loader2, X,
  Pencil, Trash2, Search, Download, PlusCircle, MinusCircle, Users,
} from "lucide-react";
import Link from "next/link";
import { SortIcon } from "@/components/admin/SortIcon";
import { buildPaginationPages } from "@/lib/paginationHelper";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatLoanTerms } from "@/lib/formatters";
import { logEvent } from "@/lib/logger";
import { exportToCsv } from "@/lib/exportCsv";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OpportunityCategory { id: string; name: string; slug: string; }

interface Pool {
  purchase_id: string;
  pool_name: string;
  pool_type: "investment" | "debt" | null;
  description: string | null;
  owner_names: string[];
  vehicle_numbers: string[];
  purchase_date: string;
  total_cost: number;
  bank_loan_amount: number;
  investor_amount: number;
  monthly_emi: number;
  emergency_fund_collected: number;
  emergency_fund_company_share: number;
  emergency_fund_investor_share: number;
  emergency_fund_remaining: number;
  status: string;
  organization_name: string | null;
  gstin: string | null;
  category_name: string | null;
  category_id: string | null;
  opportunity_categories: OpportunityCategory | null;
  receipt_id: string | null;
  business_purposes: string | null;
  created_at: string;
}

const STATUSES = ["Active", "Inactive", "Closed"];

const emptyForm = {
  poolName: "",
  description: "",
  ownerNames: [""],
  vehicleNumbers: [""],
  purchaseDate: "",
  totalCost: "",
  bankLoanAmount: "",
  investorAmount: "",
  monthlyEmi: "",
  emergencyFundCollected: "0",
  emergencyFundCompanyShare: "0",
  emergencyFundInvestorShare: "0",
  emergencyFundRemaining: "0",
  status: "Active",
  organizationName: "",
  gstin: "",
  categoryName: "",
  categoryId: "",
  receiptId: "",
  businessPurposes: "",
};

type PoolForm = typeof emptyForm;

const PAGE_SIZE = 15;

function poolToForm(p: Pool): PoolForm {
  return {
    poolName: p.pool_name,
    description: p.description ?? "",
    ownerNames: p.owner_names.length ? p.owner_names : [""],
    vehicleNumbers: p.vehicle_numbers.length ? p.vehicle_numbers : [""],
    purchaseDate: p.purchase_date,
    totalCost: String(p.total_cost),
    bankLoanAmount: String(p.bank_loan_amount),
    investorAmount: String(p.investor_amount),
    monthlyEmi: String(p.monthly_emi),
    emergencyFundCollected: String(p.emergency_fund_collected),
    emergencyFundCompanyShare: String(p.emergency_fund_company_share),
    emergencyFundInvestorShare: String(p.emergency_fund_investor_share),
    emergencyFundRemaining: String(p.emergency_fund_remaining),
    status: p.status,
    organizationName: p.organization_name ?? "",
    gstin: p.gstin ?? "",
    categoryName: p.category_name ?? "",
    categoryId: p.category_id ?? "",
    receiptId: p.receipt_id ?? "",
    businessPurposes: p.business_purposes ?? "",
  };
}

// ─── Dynamic array input ─────────────────────────────────────────────────────

function ArrayInput({ values, onChange, placeholder }: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {values.map((val, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={val}
            onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n); }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all"
          />
          {values.length > 1 && (
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="text-gray-300 hover:text-red-400 transition-colors">
              <MinusCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...values, ""])}
        className="flex items-center gap-1.5 text-xs font-bold text-[#05CE78] hover:text-[#04b067] transition-colors">
        <PlusCircle className="w-3.5 h-3.5" /> Add another
      </button>
    </div>
  );
}

// ─── Form fields helper ───────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all";

// ─── Pool form modal ──────────────────────────────────────────────────────────

function PoolFormModal({ title, form, setForm, onSubmit, onClose, submitting, categories }: {
  title: string;
  form: PoolForm;
  setForm: React.Dispatch<React.SetStateAction<PoolForm>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitting: boolean;
  categories: OpportunityCategory[];
}) {
  const set = (key: keyof PoolForm, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} disabled={submitting} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto px-6 py-5 space-y-6">

          {/* Basic info */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Basic Info</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Pool Name *">
                  <input type="text" value={form.poolName} onChange={e => set("poolName", e.target.value)} required placeholder="Pool 6 - Intercity Fleet" className={inputCls} />
                </Field>
              </div>
              <Field label="Status">
                <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select
                  value={form.categoryId}
                  onChange={e => {
                    const cat = categories.find(c => c.id === e.target.value);
                    set("categoryId", e.target.value);
                    set("categoryName", cat?.name ?? "");
                  }}
                  className={inputCls}
                >
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Purchase Date *">
                <input type="date" value={form.purchaseDate} onChange={e => set("purchaseDate", e.target.value)} required className={inputCls} />
              </Field>
              <Field label="Organization Name">
                <input type="text" value={form.organizationName} onChange={e => set("organizationName", e.target.value)} placeholder="Hustlers Ventures" className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Description">
                  <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short description..." rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all resize-none" />
                </Field>
              </div>
              <Field label="GSTIN">
                <input type="text" value={form.gstin} onChange={e => set("gstin", e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" className={`${inputCls} font-mono tracking-wider`} maxLength={15} />
              </Field>
              <Field label="Receipt ID">
                <input type="text" value={form.receiptId} onChange={e => set("receiptId", e.target.value)} placeholder="RCP-001" className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Business Purposes">
                  <input type="text" value={form.businessPurposes} onChange={e => set("businessPurposes", e.target.value)} placeholder="Intercity transportation, passenger services" className={inputCls} />
                </Field>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Financials</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Total Cost *">
                <input type="number" value={form.totalCost} onChange={e => set("totalCost", e.target.value)} required min={0} step="0.01" placeholder="5000000" className={inputCls} />
              </Field>
              <Field label="Bank Loan Amount *">
                <input type="number" value={form.bankLoanAmount} onChange={e => set("bankLoanAmount", e.target.value)} required min={0} step="0.01" placeholder="2000000" className={inputCls} />
              </Field>
              <Field label="Investor Amount *">
                <input type="number" value={form.investorAmount} onChange={e => set("investorAmount", e.target.value)} required min={0} step="0.01" placeholder="3000000" className={inputCls} />
              </Field>
              <Field label="Monthly EMI *">
                <input type="number" value={form.monthlyEmi} onChange={e => set("monthlyEmi", e.target.value)} required min={0} step="0.01" placeholder="85000" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Emergency fund */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Emergency Fund</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Collected">
                <input type="number" value={form.emergencyFundCollected} onChange={e => set("emergencyFundCollected", e.target.value)} min={0} step="0.01" placeholder="0" className={inputCls} />
              </Field>
              <Field label="Company Share">
                <input type="number" value={form.emergencyFundCompanyShare} onChange={e => set("emergencyFundCompanyShare", e.target.value)} min={0} step="0.01" placeholder="0" className={inputCls} />
              </Field>
              <Field label="Investor Share">
                <input type="number" value={form.emergencyFundInvestorShare} onChange={e => set("emergencyFundInvestorShare", e.target.value)} min={0} step="0.01" placeholder="0" className={inputCls} />
              </Field>
              <Field label="Remaining">
                <input type="number" value={form.emergencyFundRemaining} onChange={e => set("emergencyFundRemaining", e.target.value)} min={0} step="0.01" placeholder="0" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Assets */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Assets</p>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Owner Names *">
                <ArrayInput values={form.ownerNames} onChange={v => set("ownerNames", v)} placeholder="Owner name" />
              </Field>
              <Field label="Vehicle Numbers *">
                <ArrayInput values={form.vehicleNumbers} onChange={v => set("vehicleNumbers", v)} placeholder="AP 09 AB 1234" />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Pool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"pool_name" | "total_cost" | "investor_amount" | "purchase_date" | "status">("pool_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "total_cost" || key === "investor_amount" || key === "purchase_date" ? "desc" : "asc"); setPage(1); }
  };
  const { toast: status, showToast, clearToast } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<PoolForm>(emptyForm);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<Pool | null>(null);
  const [editForm, setEditForm] = useState<PoolForm>(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Pool | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [viewInvestorsPool, setViewInvestorsPool] = useState<Pool | null>(null);
  const [poolInvestors, setPoolInvestors] = useState<any[]>([]);
  const [poolInvestorsLoading, setPoolInvestorsLoading] = useState(false);

  const [categories, setCategories] = useState<OpportunityCategory[]>([]);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pools").then(r => r.json());
    setPools(res.pools ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPools();
    fetch("/api/admin/opportunity-categories").then(r => r.json()).then(d => setCategories(d.categories ?? []));
  }, [fetchPools]);

  useEffect(() => {
    if (!viewInvestorsPool) return;
    setPoolInvestorsLoading(true);
    fetch(`/api/admin/investments?poolId=${viewInvestorsPool.purchase_id}`)
      .then(r => r.json())
      .then(d => setPoolInvestors(d.investments ?? []))
      .finally(() => setPoolInvestorsLoading(false));
  }, [viewInvestorsPool]);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const q = search.toLowerCase();
  const filtered = pools.filter(p =>
    p.pool_name.toLowerCase().includes(q) ||
    (p.category_name ?? "").toLowerCase().includes(q) ||
    (p.organization_name ?? "").toLowerCase().includes(q) ||
    p.status.toLowerCase().includes(q)
  );
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    const cmp = typeof av === "number" ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  }), [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const paginationPages = buildPaginationPages(page, totalPages);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    const res = await fetch("/api/admin/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      showToast("success", `Pool "${addForm.poolName}" created.`);
      logEvent("INFO", "Admin created pool", { poolName: addForm.poolName }).catch(console.error);
      setAddForm(emptyForm);
      setShowAddModal(false);
      fetchPools();
    }
    setAddSubmitting(false);
  };

  const openEdit = (pool: Pool) => {
    setEditTarget(pool);
    setEditForm(poolToForm(pool));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSubmitting(true);
    const res = await fetch("/api/admin/pools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId: editTarget.purchase_id, ...editForm }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      showToast("success", `Pool "${editForm.poolName}" updated.`);
      logEvent("INFO", "Admin updated pool", { purchaseId: editTarget.purchase_id, poolName: editForm.poolName }).catch(console.error);
      setEditTarget(null);
      fetchPools();
    }
    setEditSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/pools", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId: deleteTarget.purchase_id }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      setPools(prev => prev.filter(p => p.purchase_id !== deleteTarget.purchase_id));
      showToast("success", `Pool "${deleteTarget.pool_name}" deleted.`);
      logEvent("WARN", "Admin deleted pool", { purchaseId: deleteTarget.purchase_id, poolName: deleteTarget.pool_name }).catch(console.error);
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#05CE78]" /> Pools
          </h1>
          <p className="text-sm text-gray-500 mt-1">{pools.length} total pools</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv(`pools-${new Date().toISOString().split("T")[0]}.csv`, filtered, [
              { key: "pool_name",       label: "Pool Name" },
              { key: "status",          label: "Status" },
              { key: "category_name",   label: "Category" },
              { key: "total_cost",      label: "Total Cost" },
              { key: "investor_amount", label: "Investor Amount" },
              { key: "bank_loan_amount",label: "Bank Loan" },
              { key: "monthly_emi",     label: "Monthly EMI" },
              { key: "purchase_date",   label: "Purchase Date" },
              { key: "organization_name", label: "Organization" },
            ])}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => { setShowAddModal(true); clearToast(); }}
            className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b067] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-900/20 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Pool
          </button>
        </div>
      </div>

      {/* Status banner */}
      {status && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${status.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
          {status.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {status.message}
          <button onClick={clearToast} className="ml-auto opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="font-bold text-gray-900 text-sm">All Pools</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, category or status..."
              className="pl-9 py-2 pr-4 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-72"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {search ? `No pools matching "${search}".` : "No pools found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {([
                    { key: "pool_name",       label: "Pool",            align: "left" },
                    { key: "total_cost",      label: "Total Cost",      align: "right" },
                    { key: "investor_amount", label: "Investor Amount", align: "right" },
                    { key: "purchase_date",   label: "Purchase Date",   align: "left" },
                    { key: "status",          label: "Status",          align: "left" },
                  ] as { key: typeof sortKey; label: string; align: string }[]).map(col => {
                    return (
                      <th key={col.key} onClick={() => handleSort(col.key)}
                        className={`px-6 py-3 text-${col.align} text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900 group`}>
                        <span className={`flex items-center gap-1 ${col.align === "right" ? "justify-end" : ""}`}>
                          {col.label}
                          <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Utilisation</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(pool => (
                  <tr key={pool.purchase_id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{pool.pool_name}</p>
                      {pool.organization_name && <p className="text-xs text-gray-400 mt-0.5">{pool.organization_name}</p>}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 tabular-nums font-medium">{formatCurrency(pool.total_cost)}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 tabular-nums">{formatCurrency(pool.investor_amount)}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(pool.purchase_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-md border ${
                        pool.status === "Active"   ? "bg-green-50 text-green-700 border-green-100" :
                        pool.status === "Inactive" ? "bg-gray-100 text-gray-500 border-gray-200" :
                                                     "bg-red-50 text-red-600 border-red-100"
                      }`}>
                        {pool.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {pool.opportunity_categories
                        ? <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100">{pool.opportunity_categories.name}</span>
                        : pool.category_name
                          ? <span className="text-xs text-gray-400">{pool.category_name}</span>
                          : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 min-w-[140px]">
                      {pool.total_cost > 0 ? (() => {
                        const pct = Math.min(100, (Number(pool.investor_amount) / Number(pool.total_cost)) * 100);
                        const color = pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : "bg-amber-400";
                        return (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500 font-medium">{pct.toFixed(0)}% filled</span>
                              <span className="text-gray-400">{formatCurrency(Number(pool.total_cost) - Number(pool.investor_amount))} left</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })() : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => { setViewInvestorsPool(pool); setPoolInvestors([]); }}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View investors">
                          <Users className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(pool)}
                          className="p-1.5 text-gray-400 hover:text-[#05CE78] hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(pool)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

      {/* ── VIEW INVESTORS MODAL ── */}
      {viewInvestorsPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewInvestorsPool(null)} />
          <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${viewInvestorsPool.pool_type === "debt" ? "max-w-4xl" : "max-w-xl"} max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#05CE78]" /> {viewInvestorsPool.pool_name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pool capacity: {formatCurrency(viewInvestorsPool.investor_amount)}
                </p>
              </div>
              <button onClick={() => setViewInvestorsPool(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto">
              {poolInvestorsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
              ) : poolInvestors.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">No investors in this pool yet.</div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      {viewInvestorsPool.pool_type === "debt" ? (
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Investor Name</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Associate Name</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Investment Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Loan Terms</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Investment Date</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Investor</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">% Share</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewInvestorsPool.pool_type === "debt" ? poolInvestors.map(inv => (
                        <tr key={inv.investment_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5">
                            <Link href={`/admin/investors/${inv.investor_id}`}
                              className="font-medium text-gray-900 hover:text-[#05CE78] transition-colors">
                              {inv.investor_name}
                            </Link>
                          </td>
                          <td className="px-6 py-3.5 text-gray-700">{inv.associate_name ?? "-"}</td>
                          <td className="px-6 py-3.5 text-right font-bold text-gray-900 tabular-nums">
                            {formatCurrency(inv.total_amount)}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
                              {formatLoanTerms(inv.debt_terms)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-gray-700 tabular-nums">{inv.phone ?? "-"}</td>
                          <td className="px-6 py-3.5 text-gray-500">
                            {new Date(inv.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      )) : poolInvestors.map(inv => {
                        const share = viewInvestorsPool.investor_amount > 0
                          ? (Number(inv.total_amount) / viewInvestorsPool.investor_amount) * 100
                          : 0;
                        return (
                          <tr key={inv.investment_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3.5">
                              <Link href={`/admin/investors/${inv.investor_id}`}
                                className="font-medium text-gray-900 hover:text-[#05CE78] transition-colors">
                                {inv.investor_name}
                              </Link>
                              <p className="text-xs text-gray-400 mt-0.5">{inv.email}</p>
                            </td>
                            <td className="px-6 py-3.5 text-right font-bold text-gray-900 tabular-nums">
                              {formatCurrency(inv.total_amount)}
                            </td>
                            <td className="px-6 py-3.5 text-right tabular-nums">
                              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                {share.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <p className="text-xs font-bold text-gray-500">{poolInvestors.length} investor{poolInvestors.length !== 1 ? "s" : ""}</p>
                    <p className="text-sm font-extrabold text-gray-900 tabular-nums">
                      {formatCurrency(poolInvestors.reduce((s, i) => s + Number(i.total_amount), 0))}
                      <span className="text-xs font-normal text-gray-400 ml-1">
                        of {formatCurrency(viewInvestorsPool.investor_amount)}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD MODAL ── */}
      {showAddModal && (
        <PoolFormModal
          title="Add Pool"
          form={addForm}
          setForm={setAddForm}
          onSubmit={handleAdd}
          onClose={() => setShowAddModal(false)}
          submitting={addSubmitting}
          categories={categories}
        />
      )}

      {/* ── EDIT MODAL ── */}
      {editTarget && (
        <PoolFormModal
          title={`Edit · ${editTarget.pool_name}`}
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleEdit}
          onClose={() => setEditTarget(null)}
          submitting={editSubmitting}
          categories={categories}
        />
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
                <h3 className="font-bold text-gray-900 text-lg">Delete Pool</h3>
                <p className="text-gray-500 text-sm mt-1">
                  This will permanently delete the pool. Investments and declarations linked to it will also be affected.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-1 border border-gray-100">
              <p><span className="text-gray-400">Pool:</span> <span className="font-medium text-gray-700">{deleteTarget.pool_name}</span></p>
              <p><span className="text-gray-400">Investor Amount:</span> <span className="font-medium text-gray-700">{formatCurrency(deleteTarget.investor_amount)}</span></p>
              <p><span className="text-gray-400">Status:</span> <span className="font-medium text-gray-700">{deleteTarget.status}</span></p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-red-900/20">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete Pool</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
