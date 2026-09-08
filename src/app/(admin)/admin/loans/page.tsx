"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Landmark, Plus, X, Loader2, Trash2,
  Download, Pencil, CalendarClock, BadgeCheck,
  CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { exportToCsv } from "@/lib/exportCsv";
import { SortIcon } from "@/components/admin/SortIcon";
import { useToast } from "@/hooks/useToast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pool {
  purchase_id: string;
  pool_name: string;
}

interface Loan {
  loan_id: string;
  borrower_name: string;
  loan_type: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  disbursal_date: string;
  maturity_date: string | null;
  status: string;
  notes: string | null;
  contact_phone: string | null;
  pool_id: string | null;
  created_at: string;
  company_pools: { pool_name: string } | null;
}

interface Emi {
  emi_id: string;
  loan_id: string;
  emi_number: number;
  due_date: string;
  paid_date: string | null;
  emi_amount: number;
  principal_component: number;
  interest_component: number;
  outstanding_principal: number;
  status: string;
  payment_reference: string | null;
  notes: string | null;
}

const LOAN_TYPES = ["Hand Loan", "Term Loan", "Working Capital Loan", "Business Loan", "Other"];
const LOAN_STATUSES = ["active", "closed", "defaulted"];

type SortKey = "borrower_name" | "loan_type" | "principal" | "interest_rate" | "disbursal_date" | "status";

const emptyForm = {
  borrower_name: "",
  loan_type: "Hand Loan",
  principal: "",
  interest_rate: "",
  tenure_months: "",
  disbursal_date: "",
  pool_id: "",
  contact_phone: "",
  notes: "",
  status: "active",
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-50 text-green-700 border border-green-100",
  closed:    "bg-gray-100 text-gray-500 border border-gray-200",
  defaulted: "bg-red-50 text-red-600 border border-red-100",
};

const EMI_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border border-amber-200",
  paid:    "bg-green-50 text-green-700 border border-green-200",
  overdue: "bg-red-50 text-red-600 border border-red-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLoansPage() {
  const { toast: status, showToast, clearToast } = useToast();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("disbursal_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Add / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // EMI drawer
  const [emiLoan, setEmiLoan] = useState<Loan | null>(null);
  const [emis, setEmis] = useState<Emi[]>([]);
  const [emisLoading, setEmisLoading] = useState(false);
  const [markingEmi, setMarkingEmi] = useState<string | null>(null);

  // Payment reference prompt
  const [payEmi, setPayEmi] = useState<Emi | null>(null);
  const [payRef, setPayRef] = useState("");

  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/loans");
    const json = await res.json();
    setLoans(json.loans ?? []);
    setLoading(false);
  }, []);

  const fetchPools = useCallback(async () => {
    const res = await fetch("/api/admin/pools");
    const json = await res.json();
    setPools((json.pools ?? []).map((p: any) => ({ purchase_id: p.purchase_id, pool_name: p.pool_name })));
  }, []);

  useEffect(() => { fetchLoans(); fetchPools(); }, [fetchLoans, fetchPools]);

  const fetchEmis = useCallback(async (loanId: string) => {
    setEmisLoading(true);
    const res = await fetch(`/api/admin/loan-emis?loan_id=${loanId}`);
    const json = await res.json();
    setEmis(json.emis ?? []);
    setEmisLoading(false);
  }, []);

  // ─── Sorting / filtering ──────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...loans];
    if (statusFilter !== "all") list = list.filter(l => l.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(l =>
      l.borrower_name.toLowerCase().includes(q) ||
      l.loan_type.toLowerCase().includes(q) ||
      (l.company_pools?.pool_name ?? "").toLowerCase().includes(q)
    );
    return list;
  }, [loans, search, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ─── Add / Edit ───────────────────────────────────────────────────────────

  const openAdd = () => { setForm({ ...emptyForm }); setEditLoan(null); clearToast(); setShowForm(true); };
  const openEdit = (l: Loan) => {
    setForm({
      borrower_name: l.borrower_name,
      loan_type: l.loan_type,
      principal: String(l.principal),
      interest_rate: String(l.interest_rate),
      tenure_months: String(l.tenure_months),
      disbursal_date: l.disbursal_date,
      pool_id: l.pool_id ?? "",
      contact_phone: l.contact_phone ?? "",
      notes: l.notes ?? "",
      status: l.status,
    });
    setEditLoan(l);
    clearToast();
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.borrower_name || !form.loan_type || !form.principal || !form.interest_rate || !form.tenure_months || !form.disbursal_date) {
      showToast("error", "Fill in all required fields."); return;
    }
    setSaving(true);
    const payload = {
      ...form,
      principal: Number(form.principal),
      interest_rate: Number(form.interest_rate),
      tenure_months: Number(form.tenure_months),
      pool_id: form.pool_id || null,
    };
    const method = editLoan ? "PATCH" : "POST";
    const body = editLoan ? { loan_id: editLoan.loan_id, ...payload } : payload;
    const res = await fetch("/api/admin/loans", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) { showToast("error", json.error ?? "Failed"); setSaving(false); return; }
    showToast("success", editLoan ? "Loan updated." : "Loan created with EMI schedule.");
    setSaving(false);
    setShowForm(false);
    fetchLoans();
  };

  const handleDelete = async (loanId: string) => {
    if (!confirm("Delete this loan and all its EMIs?")) return;
    const res = await fetch(`/api/admin/loans?loan_id=${loanId}`, { method: "DELETE" });
    if (!res.ok) { showToast("error", "Delete failed."); return; }
    showToast("success", "Loan deleted.");
    fetchLoans();
  };

  // ─── EMI actions ──────────────────────────────────────────────────────────

  const markEmiPaid = async (emi: Emi, reference: string) => {
    setMarkingEmi(emi.emi_id);
    const paidDate = new Date().toISOString().slice(0, 10);
    const res = await fetch("/api/admin/loan-emis", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emi_id: emi.emi_id, status: "paid", paid_date: paidDate, payment_reference: reference || null }),
    });
    if (!res.ok) { showToast("error", "Failed to update EMI."); setMarkingEmi(null); return; }
    setEmis(prev => prev.map(e => e.emi_id === emi.emi_id
      ? { ...e, status: "paid", paid_date: paidDate, payment_reference: reference || null }
      : e
    ));
    setMarkingEmi(null);
    setPayEmi(null);
    setPayRef("");
    showToast("success", `EMI #${emi.emi_number} marked as paid.`);
  };

  // ─── Export ───────────────────────────────────────────────────────────────

  const handleExport = () => {
    exportToCsv(`loans-${new Date().toISOString().split("T")[0]}.csv`, filtered, [
      { key: "borrower_name",  label: "Borrower" },
      { key: "loan_type",      label: "Type" },
      { key: "principal",      label: "Principal" },
      { key: "interest_rate",  label: "Rate %" },
      { key: "tenure_months",  label: "Tenure (months)" },
      { key: "disbursal_date", label: "Disbursal Date" },
      { key: "maturity_date",  label: "Maturity Date" },
      { key: "status",         label: "Status" },
      { key: "notes",          label: "Notes" },
    ]);
  };

  // ─── EMI summary ─────────────────────────────────────────────────────────

  const emiSummary = useMemo(() => {
    const paid    = emis.filter(e => e.status === "paid").length;
    const overdue = emis.filter(e => e.status === "overdue").length;
    const pending = emis.filter(e => e.status === "pending").length;
    const outstanding = emis.find(e => e.status !== "paid")?.outstanding_principal
      ?? (emis.length ? emis[emis.length - 1].outstanding_principal : 0);
    return { paid, overdue, pending, outstanding };
  }, [emis]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#05CE78]" /> Loans
          </h1>
          <p className="text-sm text-gray-500 mt-1">{loans.length} total loans</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-900/20 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Loan
          </button>
        </div>
      </div>

      {/* Status banner */}
      {status && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${status.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
          {status.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {status.message}
          <button onClick={clearToast} className="ml-auto text-current opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Loans table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filters + search */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {["all", "active", "closed", "defaulted"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize cursor-pointer
                  ${statusFilter === s ? "bg-[#0B1120] text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                {s}
                {s !== "all" && (
                  <span className="ml-1.5 text-xs opacity-60">
                    {loans.filter(l => l.status === s).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search borrower, type, pool…"
            className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-72"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {([
                  ["borrower_name", "Borrower"],
                  ["loan_type",     "Type"],
                  ["principal",     "Principal"],
                  ["interest_rate", "Rate"],
                  ["disbursal_date","Disbursed"],
                  ["status",        "Status"],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} onClick={() => handleSort(key)}
                    className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900">
                    <span className="flex items-center gap-1">
                      {label}
                      <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pool</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78] mx-auto" /></td></tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Landmark className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-400 mb-1">
                      {loans.length === 0 ? "No loans yet" : "No loans match your filters"}
                    </p>
                    {loans.length === 0 && (
                      <button onClick={openAdd} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#05CE78] hover:underline cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Add your first loan
                      </button>
                    )}
                  </td>
                </tr>
              ) : sorted.map(loan => (
                <tr key={loan.loan_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{loan.borrower_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-100">
                      {loan.loan_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(loan.principal)}</td>
                  <td className="px-6 py-4 text-gray-600">{loan.interest_rate}% p.a.</td>
                  <td className="px-6 py-4 text-gray-500">{loan.disbursal_date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold capitalize ${STATUS_STYLES[loan.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{loan.company_pools?.pool_name ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEmiLoan(loan); fetchEmis(loan.loan_id); }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-100 transition-colors cursor-pointer"
                      >
                        <CalendarClock className="w-3 h-3" /> EMIs
                      </button>
                      <button onClick={() => openEdit(loan)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(loan.loan_id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editLoan ? "Edit Loan" : "Add Loan"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Borrower Name *</label>
                <input value={form.borrower_name} onChange={e => setForm(p => ({ ...p, borrower_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
                  placeholder="Name or entity" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Loan Type *</label>
                <div className="flex flex-wrap gap-2">
                  {LOAN_TYPES.map(t => (
                    <button key={t} onClick={() => setForm(p => ({ ...p, loan_type: t }))}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${form.loan_type === t ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-gray-600 border-gray-200 hover:border-cyan-300"}`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Principal (₹) *</label>
                  <input type="number" min="0" value={form.principal} onChange={e => setForm(p => ({ ...p, principal: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
                    placeholder="e.g. 500000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Interest Rate (% p.a.) *</label>
                  <input type="number" min="0" step="0.01" value={form.interest_rate} onChange={e => setForm(p => ({ ...p, interest_rate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
                    placeholder="e.g. 18" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tenure (months) *</label>
                  <input type="number" min="1" value={form.tenure_months} onChange={e => setForm(p => ({ ...p, tenure_months: e.target.value }))}
                    disabled={!!editLoan}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm disabled:opacity-50"
                    placeholder="e.g. 12" />
                  {editLoan && <p className="text-xs text-gray-400 mt-1">Fixed after creation</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Disbursal Date *</label>
                  <input type="date" value={form.disbursal_date} onChange={e => setForm(p => ({ ...p, disbursal_date: e.target.value }))}
                    disabled={!!editLoan}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm disabled:opacity-50" />
                  {editLoan && <p className="text-xs text-gray-400 mt-1">Fixed after creation</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Linked Pool (optional)</label>
                <select value={form.pool_id} onChange={e => setForm(p => ({ ...p, pool_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm">
                  <option value="">— None —</option>
                  {pools.map(p => <option key={p.purchase_id} value={p.purchase_id}>{p.pool_name}</option>)}
                </select>
              </div>
              {editLoan && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</label>
                  <div className="flex gap-2">
                    {LOAN_STATUSES.map(s => (
                      <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border capitalize transition-colors cursor-pointer ${form.status === s ? "bg-[#0B1120] text-white border-[#0B1120]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Contact Phone <span className="font-normal text-gray-400 normal-case">(for WhatsApp reminders — optional)</span>
                </label>
                <input type="tel" value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
                  placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm resize-none"
                  placeholder="Optional notes…" />
              </div>
            </div>
            <div className="flex items-center justify-between px-6 pb-6 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">{editLoan ? "Principal, rate and tenure affect the EMI schedule." : "EMI schedule will be auto-generated on creation."}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editLoan ? "Save Changes" : "Create Loan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Paid — Payment Reference Modal ────────────────────────────── */}
      {payEmi && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Mark EMI #{payEmi.emi_number} Paid</h3>
              <button onClick={() => setPayEmi(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-900">{formatCurrency(payEmi.emi_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Due Date</span>
                <span className="text-gray-700">{payEmi.due_date}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Payment Reference <span className="font-normal text-gray-400 normal-case">(UPI / transfer ID — optional)</span>
                </label>
                <input
                  autoFocus
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && markEmiPaid(payEmi, payRef)}
                  placeholder="e.g. UPI/123456789"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm font-mono"
                />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setPayEmi(null)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => markEmiPaid(payEmi, payRef)}
                disabled={markingEmi === payEmi.emi_id}
                className="flex-1 flex items-center justify-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold py-2.5 rounded-xl transition-all text-sm disabled:opacity-60 cursor-pointer"
              >
                {markingEmi === payEmi.emi_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMI Schedule Modal ──────────────────────────────────────────────── */}
      {emiLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{emiLoan.borrower_name} — EMI Schedule</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {emiLoan.loan_type} · {formatCurrency(emiLoan.principal)} · {emiLoan.interest_rate}% p.a. · {emiLoan.tenure_months} months
                </p>
              </div>
              <button onClick={() => { setEmiLoan(null); setEmis([]); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            {!emisLoading && emis.length > 0 && (
              <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 shrink-0">
                {[
                  { label: "Paid",    value: emiSummary.paid,    color: "text-green-600" },
                  { label: "Pending", value: emiSummary.pending, color: "text-amber-500" },
                  { label: "Overdue", value: emiSummary.overdue, color: "text-red-500" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{s.label}</div>
                    <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
                <div className="text-center">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Outstanding</div>
                  <div className="text-sm font-black text-gray-900">{formatCurrency(emiSummary.outstanding)}</div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-y-auto flex-1">
              {emisLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
              ) : emis.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">No EMIs found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <tr>
                      {["#", "Due Date", "EMI", "Principal", "Interest", "Outstanding", "Status", ""].map((h, i) => (
                        <th key={i} className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider ${i >= 2 && i <= 5 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {emis.map(emi => (
                      <tr key={emi.emi_id} className={`hover:bg-gray-50 transition-colors ${emi.status === "overdue" ? "bg-red-50/40" : ""}`}>
                        <td className="px-4 py-3 text-gray-400 font-medium">{emi.emi_number}</td>
                        <td className="px-4 py-3">
                          <div className="text-gray-700">{emi.due_date}</div>
                          {emi.paid_date && <div className="text-xs text-green-600 mt-0.5">Paid {emi.paid_date}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(emi.emi_amount)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(emi.principal_component)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(emi.interest_component)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(emi.outstanding_principal)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold capitalize ${EMI_STATUS_STYLES[emi.status] ?? ""}`}>
                            {emi.status === "paid"    && <CheckCircle2 className="w-3 h-3" />}
                            {emi.status === "pending" && <Clock className="w-3 h-3" />}
                            {emi.status === "overdue" && <AlertCircle className="w-3 h-3" />}
                            {emi.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {emi.status === "paid" ? (
                            emi.payment_reference && (
                              <span className="text-xs text-gray-400 font-mono">{emi.payment_reference}</span>
                            )
                          ) : (
                            <button
                              onClick={() => { setPayEmi(emi); setPayRef(""); }}
                              disabled={markingEmi === emi.emi_id}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              {markingEmi === emi.emi_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3 h-3" />}
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
