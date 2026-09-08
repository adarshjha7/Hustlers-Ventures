"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Users, Plus, CheckCircle2, AlertCircle, Loader2, Phone, Mail, User, X, Pencil, Trash2, UserCheck, CreditCard, Save, KeyRound, Download, Bell, Eye, Send, XCircle, Copy, Wrench, Landmark } from "lucide-react";
import { SortIcon } from "@/components/admin/SortIcon";
import { useToast } from "@/hooks/useToast";
import { logEvent } from "@/lib/logger";
import { exportToCsv } from "@/lib/exportCsv";
import AdminWhatsAppInviteCard from "@/components/AdminWhatsAppInviteCard";

interface Investor {
  investor_id: string;
  user_id: string | null;
  investor_name: string;
  email: string;
  phone: string | null;
  pan_number: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  requires_password_change: boolean;
  is_active: boolean;
  associate_name: string | null;
}

interface OnboardingInfo {
  status: "registered" | "pending";
  inviteSentAt: string | null;
  whatsappSent: boolean | null;
  whatsappError: string | null;
  registeredAt: string | null;
}

const emptyForm = { name: "", email: "", phone: "", associateName: "" };
const emptyEditForm = { name: "", phone: "", panNumber: "", bankAccount: "", ifsc: "", associateName: "", isActive: true };

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [onboardingByInvestor, setOnboardingByInvestor] = useState<Record<string, OnboardingInfo>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { toast: status, showToast, clearToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "exited">("all");
  const [registrationFilter, setRegistrationFilter] = useState<"all" | "registered" | "pending">("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"investor_name" | "email" | "associate_name">("investor_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const PAGE_SIZE = 15;

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); setPage(1); }
  };

  // Edit modal state
  const [editTarget, setEditTarget] = useState<Investor | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Investor | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Setup reminders
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const pendingCount = investors.filter(i => i.requires_password_change && i.is_active !== false).length;

  // Copy saved onboarding invite link (pending/no-login investors only)
  const [copyingLink, setCopyingLink] = useState<string | null>(null);
  const handleCopyInviteLink = async (investorId: string) => {
    setCopyingLink(investorId);
    try {
      const res = await fetch(`/api/admin/invite/link?investorId=${investorId}`);
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Could not fetch invite link."); return; }
      await navigator.clipboard.writeText(data.inviteUrl);
      showToast(
        data.expired ? "error" : "success",
        data.expired ? "Link copied, but it has expired — generate a new one instead." : "Invite link copied."
      );
    } catch {
      showToast("error", "Could not copy link.");
    } finally {
      setCopyingLink(null);
    }
  };

  // Safety net: finds investments still showing user_id: null where the linked investor
  // has actually registered, and backfills them (see the registration route's backfill step).
  const [repairing, setRepairing] = useState(false);
  const handleRepairOrphaned = async () => {
    setRepairing(true);
    try {
      const res = await fetch("/api/admin/repair-orphaned-investments", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Repair failed."); return; }
      showToast(
        data.fixed > 0 ? "success" : "success",
        data.fixed > 0
          ? `Fixed ${data.fixed} investment${data.fixed !== 1 ? "s" : ""} that weren't showing on investors' dashboards.`
          : "No orphaned investments found — everything's already correctly linked."
      );
    } catch {
      showToast("error", "Repair failed.");
    } finally {
      setRepairing(false);
    }
  };

  const handleSendReminder = async (email: string, id: string) => {
    setSendingReminder(id);
    const res = await fetch("/api/admin/setup-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id === "bulk" ? {} : { email }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast("success", id === "bulk"
        ? `Reminder sent to ${data.sent} investor${data.sent !== 1 ? "s" : ""}${data.failed ? `. ${data.failed} failed.` : "."}`
        : "Setup reminder sent."
      );
    } else {
      showToast("error", data.error || "Failed to send reminder.");
    }
    setSendingReminder(null);
  };

  // Password reset
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const fetchInvestors = async () => {
    setLoadingList(true);
    const [res, onboardingRes] = await Promise.all([
      fetch("/api/admin/investors"),
      fetch("/api/admin/onboarding-status"),
    ]);
    const data = await res.json();
    setInvestors(data.investors ?? []);
    const onboardingData = await onboardingRes.json().catch(() => ({ report: [] }));
    setOnboardingByInvestor(
      Object.fromEntries((onboardingData.report ?? []).map((r: any) => [r.investor_id, r]))
    );
    setLoadingList(false);
  };

  useEffect(() => { fetchInvestors(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearToast();
    const res = await fetch("/api/admin/investors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      const msg = data.authUserCreated
        ? `Investor "${form.name}" created. Welcome email sent to ${form.email}.`
        : `Investor "${form.name}" linked to existing account.`;
      showToast("success", msg);
      logEvent("INFO", "Admin created investor", { name: form.name, email: form.email, authUserCreated: data.authUserCreated }).catch(console.error);
      setForm(emptyForm);
      setShowForm(false);
      fetchInvestors();
    }
    setSubmitting(false);
  };

  const openEdit = (inv: Investor) => {
    setResetSent(false);
    setEditTarget(inv);
    setEditForm({
      name: inv.investor_name,
      phone: inv.phone ?? "",
      panNumber: inv.pan_number ?? "",
      bankAccount: inv.bank_account_no ?? "",
      ifsc: inv.bank_ifsc ?? "",
      associateName: inv.associate_name ?? "",
      isActive: inv.is_active !== false,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSavingEdit(true);
    const res = await fetch("/api/admin/investors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        investorId: editTarget.investor_id,
        name: editForm.name,
        phone: editForm.phone,
        panNumber: editForm.panNumber,
        bankAccount: editForm.bankAccount,
        ifsc: editForm.ifsc,
        associateName: editForm.associateName,
        isActive: editForm.isActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      setInvestors(prev => prev.map(inv =>
        inv.investor_id === editTarget.investor_id
          ? {
              ...inv,
              investor_name: editForm.name,
              phone: editForm.phone || null,
              pan_number: editForm.panNumber || null,
              bank_account_no: editForm.bankAccount || null,
              bank_ifsc: editForm.ifsc || null,
              associate_name: editForm.associateName || null,
              is_active: editForm.isActive,
            }
          : inv
      ));
      showToast("success", `"${editForm.name}" updated successfully.`);
      logEvent("INFO", "Admin updated investor", { investorId: editTarget.investor_id, name: editForm.name, isActive: editForm.isActive }).catch(console.error);
      setEditTarget(null);
    }
    setSavingEdit(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/investors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investorId: deleteTarget.investor_id }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      showToast("success", `"${deleteTarget.investor_name}" has been deleted.`);
      logEvent("WARN", "Admin deleted investor", { investorId: deleteTarget.investor_id, name: deleteTarget.investor_name, email: deleteTarget.email }).catch(console.error);
      setDeleteTarget(null);
      setSearch("");
      fetchInvestors();
    }
    setDeleting(false);
  };

  const handleSendReset = async () => {
    if (!editTarget) return;
    setSendingReset(true);
    await fetch("/api/password-reset/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: editTarget.email }),
    });
    logEvent("INFO", "Admin sent password reset", { email: editTarget.email, investorId: editTarget.investor_id }).catch(console.error);
    setSendingReset(false);
    setResetSent(true);
    setTimeout(() => setResetSent(false), 3000);
  };

  const q = search.toLowerCase();
  const filtered = investors.filter(inv => {
    const matchesSearch = inv.investor_name.toLowerCase().includes(q) ||
      inv.email.toLowerCase().includes(q) ||
      (inv.associate_name ?? "").toLowerCase().includes(q);
    // "Active" = has capital deployed; "Exited" = all capital withdrawn (consistent with dashboard + broadcast)
    const hasCapital = (inv as any).has_active_investments ?? inv.is_active !== false;
    const matchesStatus = statusFilter === "all" ? true : statusFilter === "active" ? hasCapital : !hasCapital;
    const registrationStatus = onboardingByInvestor[inv.investor_id]?.status ?? (inv.user_id ? "registered" : "pending");
    const matchesRegistration = registrationFilter === "all" ? true : registrationFilter === registrationStatus;
    return matchesSearch && matchesStatus && matchesRegistration;
  });

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = (a[sortKey] ?? "").toLowerCase();
    const bv = (b[sortKey] ?? "").toLowerCase();
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  }), [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#05CE78]" /> Investors
          </h1>
          <p className="text-sm text-gray-500 mt-1">{investors.length} total accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv(`investors-${new Date().toISOString().split("T")[0]}.csv`, filtered, [
              { key: "investor_name", label: "Name" },
              { key: "email",         label: "Email" },
              { key: "phone",         label: "Phone" },
              { key: "pan_number",    label: "PAN Number" },
              { key: "associate_name",label: "Associate" },
              { key: "is_active",     label: "Active" },
              { key: "requires_password_change", label: "Pending Setup" },
            ])}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          {pendingCount > 0 && (
            <button
              onClick={() => handleSendReminder("", "bulk")}
              disabled={sendingReminder === "bulk"}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-600 border border-amber-200 hover:border-amber-400 hover:bg-amber-50 rounded-xl transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {sendingReminder === "bulk"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Bell className="w-4 h-4" />}
              Remind Pending ({pendingCount})
            </button>
          )}
          <button
            onClick={handleRepairOrphaned}
            disabled={repairing}
            title="Find and fix any investments that aren't correctly linked to a registered investor's login"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {repairing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
            Repair Links
          </button>
          <AdminWhatsAppInviteCard />
          <button
            onClick={() => { setShowForm(true); clearToast(); }}
            className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b067] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-900/20 text-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Investor
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

      {/* Add Investor Form */}
      {showForm && (
        <div className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900 text-lg">New Investor</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                <User className="w-3 h-3 inline mr-1" /> Full Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Rajesh Kumar"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                <Mail className="w-3 h-3 inline mr-1" /> Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="investor@example.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                <Phone className="w-3 h-3 inline mr-1" /> Phone (optional)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                <UserCheck className="w-3 h-3 inline mr-1" /> Associate Name (optional)
              </label>
              <input
                type="text"
                value={form.associateName}
                onChange={e => setForm(f => ({ ...f, associateName: e.target.value }))}
                placeholder="Referring associate"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">A secure temporary password will be auto-generated and emailed to the investor.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Investor"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Investor List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { key: "all",    label: "All" },
              { key: "active", label: "Active" },
              { key: "exited", label: "Exited" },
            ].map(f => (
              <button key={f.key}
                onClick={() => { setStatusFilter(f.key as any); setRegistrationFilter("all"); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer
                  ${statusFilter === f.key && registrationFilter === "all" ? "bg-[#0B1120] text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                {f.label}
                {f.key !== "all" && (
                  <span className="ml-1.5 text-xs opacity-60">
                    {f.key === "active"
                      ? investors.filter(i => (i as any).has_active_investments ?? i.is_active !== false).length
                      : investors.filter(i => !((i as any).has_active_investments ?? i.is_active !== false)).length}
                  </span>
                )}
              </button>
            ))}
            <span className="w-px h-5 bg-gray-300 mx-1" />
            {[
              { key: "registered", label: "Registered" },
              { key: "pending",    label: "Pending" },
            ].map(f => (
              <button key={f.key}
                onClick={() => { setRegistrationFilter(f.key as any); setStatusFilter("all"); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer
                  ${registrationFilter === f.key ? "bg-[#0B1120] text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                {f.label}
                <span className="ml-1.5 text-xs opacity-60">
                  {investors.filter(i => (onboardingByInvestor[i.investor_id]?.status ?? (i.user_id ? "registered" : "pending")) === f.key).length}
                </span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email or associate..."
            className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-72"
          />
        </div>

        {loadingList ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No investors found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {(["investor_name", "email", "associate_name"] as const).map((key, i) => {
                    const labels = ["Name", "Email", "Associate"];
                    return (
                      <th key={key} onClick={() => handleSort(key)}
                        className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900 group">
                        <span className="flex items-center gap-1">
                          {labels[i]}
                          <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Registration</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(inv => (
                  <tr key={inv.investor_id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/admin/investors/${inv.investor_id}`} className="font-semibold text-gray-900 hover:text-[#05CE78] transition-colors">
                        {inv.investor_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{inv.email}</td>
                    <td className="px-6 py-4 text-gray-500">{inv.associate_name ?? <span className="text-gray-300">-</span>}</td>
                    <td className="px-6 py-4 text-gray-500">{inv.phone ?? <span className="text-gray-300">-</span>}</td>
                    <td className="px-6 py-4">
                      {inv.is_active === false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-md border border-gray-200">Inactive</span>
                      ) : inv.requires_password_change ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-md border border-orange-100">Pending Setup</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-100">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const onboarding = onboardingByInvestor[inv.investor_id];
                        if (!onboarding || onboarding.status === "registered") {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-100">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Registered
                            </span>
                          );
                        }
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-100">
                              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Pending
                            </span>
                            {onboarding.inviteSentAt ? (
                              onboarding.whatsappSent === false ? (
                                <span title={onboarding.whatsappError ?? "WhatsApp send failed"}><XCircle className="w-3.5 h-3.5 text-red-400" /></span>
                              ) : (
                                <span title={`Invite sent ${new Date(onboarding.inviteSentAt).toLocaleString("en-IN")}`}><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></span>
                              )
                            ) : (
                              <span title="No invite recorded"><Send className="w-3.5 h-3.5 text-gray-300" /></span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/investors/${inv.investor_id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {!inv.user_id && (
                          <button
                            onClick={() => handleCopyInviteLink(inv.investor_id)}
                            disabled={copyingLink === inv.investor_id}
                            className="p-1.5 text-gray-400 hover:text-[#05CE78] hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            title="Copy invite link"
                          >
                            {copyingLink === inv.investor_id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                        {!inv.user_id && (
                          <AdminWhatsAppInviteCard
                            investorId={inv.investor_id}
                            initialName={inv.investor_name}
                            initialPhone={inv.phone ?? ""}
                            initialAssociateName={inv.associate_name ?? ""}
                            onSent={fetchInvestors}
                          />
                        )}
                        {inv.requires_password_change && inv.user_id && (
                          <button
                            onClick={() => handleSendReminder(inv.email, inv.investor_id)}
                            disabled={sendingReminder === inv.investor_id}
                            className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            title="Send setup reminder"
                          >
                            {sendingReminder === inv.investor_id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Bell className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(inv)}
                          className="p-1.5 text-gray-400 hover:text-[#05CE78] hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(inv)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Delete"
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

        {/* Pagination */}
        {!loadingList && sorted.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, sorted.length)}</span> of <span className="font-semibold text-gray-600">{sorted.length}</span> investors
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${page === p ? "bg-[#0B1120] text-white border-[#0B1120]" : "text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900"}`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !savingEdit && setEditTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Edit Investor</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editTarget.email}</p>
              </div>
              <button onClick={() => setEditTarget(null)} disabled={savingEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    <User className="w-3 h-3 inline mr-1" /> Full Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
                  />
                </div>

                {/* Email - read-only */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    <Mail className="w-3 h-3 inline mr-1" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={editTarget.email}
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-400 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email is managed via authentication and cannot be changed here.</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    <Phone className="w-3 h-3 inline mr-1" /> Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
                  />
                </div>

                {/* PAN */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    <CreditCard className="w-3 h-3 inline mr-1" /> PAN Number
                  </label>
                  <input
                    type="text"
                    value={editForm.panNumber}
                    onChange={e => setEditForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm font-mono tracking-wider"
                  />
                </div>

                {/* Bank Account */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    <Landmark className="w-3 h-3 inline mr-1" /> Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={editForm.bankAccount}
                    onChange={e => setEditForm(f => ({ ...f, bankAccount: e.target.value }))}
                    placeholder="e.g. 3332500100675101"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm font-mono tracking-wider"
                  />
                </div>

                {/* IFSC */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    <Landmark className="w-3 h-3 inline mr-1" /> IFSC
                  </label>
                  <input
                    type="text"
                    value={editForm.ifsc}
                    onChange={e => setEditForm(f => ({ ...f, ifsc: e.target.value.toUpperCase() }))}
                    placeholder="KARB0000333"
                    maxLength={11}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm font-mono tracking-wider"
                  />
                </div>

                {/* Associate Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    <UserCheck className="w-3 h-3 inline mr-1" /> Associate Name
                  </label>
                  <input
                    type="text"
                    value={editForm.associateName}
                    onChange={e => setEditForm(f => ({ ...f, associateName: e.target.value }))}
                    placeholder="Referring associate"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                        className="sr-only"
                      />
                      <div
                        onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
                        className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${editForm.isActive ? "bg-[#05CE78]" : "bg-gray-300"} flex items-center px-[3px]`}
                      >
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

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3">
                <button
                  type="button"
                  onClick={handleSendReset}
                  disabled={sendingReset || savingEdit}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
                  title="Send password reset email to investor"
                >
                  {sendingReset
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                    : resetSent
                    ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> <span className="text-green-600">Reset Sent</span></>
                    : <><KeyRound className="w-4 h-4" /> Send Reset Email</>
                  }
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    disabled={savingEdit}
                    className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit || !editForm.name}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                  </button>
                </div>
              </div>
            </form>
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
                <h3 className="font-bold text-gray-900 text-lg">Delete Investor</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">{deleteTarget.investor_name}</span>?
                  This will remove their investor record permanently.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-1 border border-gray-100">
              <p><span className="text-gray-400">Name:</span> <span className="font-medium text-gray-700">{deleteTarget.investor_name}</span></p>
              <p><span className="text-gray-400">Email:</span> <span className="font-medium text-gray-700">{deleteTarget.email}</span></p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete Investor</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
