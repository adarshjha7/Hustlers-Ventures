"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Lightbulb, Plus, Pencil, Trash2, Loader2, X, Save,
  CheckCircle2, AlertCircle, Search, Download, Eye, EyeOff,
  ExternalLink, Tag, Building2, ListFilter, Users, Upload, ImageOff, FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useToast } from "@/hooks/useToast";
import { exportToCsv } from "@/lib/exportCsv";
import { SortIcon } from "@/components/admin/SortIcon";

interface Category { id: string; name: string; slug: string; }
interface Pool { purchase_id: string; pool_name: string; status: string; }

interface LinkedInvestment {
  investment_id: string;
  investor_name: string;
  email: string;
  total_amount: number;
  created_at: string;
}

interface Opportunity {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  min_investment: number | null;
  target_irr: number | null;
  tenure: string | null;
  total_pool_size: number | null;
  filled_pct: number | null;
  computed_filled_pct: number | null;
  pool_id: string | null;
  pool_name: string | null;
  company_name: string | null;
  image_url: string | null;
  brochure_url: string | null;
  detail_url: string | null;
  whatsapp_number: string | null;
  gallery_folder_id: string | null;
  is_public: boolean;
  is_for_investor: boolean;
  status: string;
  sort_order: number;
  volatility_level: string | null;
  volatility_note: string | null;
  created_at: string;
  opportunity_categories: Category | null;
}

const STATUS_OPTIONS = ["draft", "active", "coming_soon", "closed", "archived"];
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", active: "Active", coming_soon: "Coming Soon",
  closed: "Closed", archived: "Archived",
};

// Friendly type filters shown in the UI — each maps to one or more status values
const TYPE_FILTERS = [
  { key: "all",        label: "All" },
  { key: "open",       label: "Open" },
  { key: "new",        label: "New" },
  { key: "closed",     label: "Closed" },
  { key: "draft",      label: "Draft" },
] as const;

type TypeFilter = typeof TYPE_FILTERS[number]["key"];

function matchesTypeFilter(status: string, filter: TypeFilter): boolean {
  if (filter === "all")    return true;
  if (filter === "open")   return status === "active";
  if (filter === "new")    return status === "coming_soon";
  if (filter === "closed") return status === "closed" || status === "archived";
  if (filter === "draft")  return status === "draft";
  return true;
}
const STATUS_COLORS: Record<string, string> = {
  draft:       "bg-gray-100 text-gray-600 border-gray-200",
  active:      "bg-green-50 text-green-700 border-green-200",
  coming_soon: "bg-blue-50 text-blue-700 border-blue-200",
  closed:      "bg-orange-50 text-orange-600 border-orange-200",
  archived:    "bg-gray-100 text-gray-400 border-gray-200",
};

const VOLATILITY_OPTIONS = ["Low", "Medium", "High"] as const;
type VolatilityLevel = typeof VOLATILITY_OPTIONS[number];

const VOLATILITY_COLORS: Record<VolatilityLevel, string> = {
  Low:    "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High:   "bg-red-50 text-red-600 border-red-200",
};

const emptyForm = {
  category_id: "", title: "", slug: "", tagline: "", description: "",
  min_investment: "", target_irr: "", tenure: "", total_pool_size: "", filled_pct: "",
  pool_id: "", company_name: "", image_url: "", brochure_url: "", detail_url: "",
  whatsapp_number: "", gallery_folder_id: "",
  is_public: false, is_for_investor: false, status: "draft", sort_order: "0",
  volatility_level: "", volatility_note: "",
};

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortKey, setSortKey] = useState<"title" | "min_investment" | "target_irr" | "created_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "created_at" || key === "min_investment" || key === "target_irr" ? "desc" : "asc"); }
  };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editTarget, setEditTarget] = useState<Opportunity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Opportunity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [investmentsTarget, setInvestmentsTarget] = useState<Opportunity | null>(null);
  const [linkedInvestments, setLinkedInvestments] = useState<LinkedInvestment[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/opportunities/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed.");
      setForm(f => ({ ...f, image_url: data.url }));
    } catch (err: any) {
      showToast("error", err?.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBrochure(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/opportunities/upload-brochure", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed.");
      setForm(f => ({ ...f, brochure_url: data.url }));
    } catch (err: any) {
      showToast("error", err?.message || "Brochure upload failed.");
    } finally {
      setUploadingBrochure(false);
      if (brochureInputRef.current) brochureInputRef.current.value = "";
    }
  };

  const openLinkedInvestments = async (o: Opportunity) => {
    setInvestmentsTarget(o);
    setLinkedInvestments([]);
    if (!o.pool_id) return;
    setLoadingLinked(true);
    const res = await fetch(`/api/admin/investments?poolId=${o.pool_id}`);
    const data = await res.json();
    setLinkedInvestments(data.investments ?? []);
    setLoadingLinked(false);
  };

  const fetchAll = async () => {
    setLoading(true);
    const [oppRes, catRes, poolRes] = await Promise.all([
      fetch("/api/admin/opportunities").then(r => r.json()),
      fetch("/api/admin/opportunity-categories").then(r => r.json()),
      fetch("/api/admin/pools").then(r => r.json()),
    ]);
    setOpportunities(oppRes.opportunities ?? []);
    setCategories(catRes.categories ?? []);
    setPools(poolRes.pools ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...opportunities]
      .filter(o => {
        const matchSearch = !q || o.title.toLowerCase().includes(q) || (o.tagline ?? "").toLowerCase().includes(q) || (o.company_name ?? "").toLowerCase().includes(q);
        const matchCat = activeCategory === "all" || o.category_id === activeCategory;
        const matchType = matchesTypeFilter(o.status, typeFilter);
        return matchSearch && matchCat && matchType;
      })
      .sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = typeof av === "number" ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [opportunities, search, activeCategory, typeFilter, sortKey, sortDir]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (o: Opportunity) => {
    setEditTarget(o);
    setForm({
      category_id: o.category_id ?? "",
      title: o.title, slug: o.slug, tagline: o.tagline ?? "", description: o.description ?? "",
      min_investment: o.min_investment != null ? String(o.min_investment) : "",
      target_irr: o.target_irr != null ? String(o.target_irr) : "",
      tenure: o.tenure ?? "",
      total_pool_size: o.total_pool_size != null ? String(o.total_pool_size) : "",
      filled_pct: o.filled_pct != null ? String(o.filled_pct) : "",
      pool_id: o.pool_id ?? "", company_name: o.company_name ?? "",
      image_url: o.image_url ?? "", brochure_url: o.brochure_url ?? "", detail_url: o.detail_url ?? "",
      whatsapp_number: o.whatsapp_number ?? "", gallery_folder_id: o.gallery_folder_id ?? "",
      is_public: o.is_public, is_for_investor: o.is_for_investor,
      status: o.status, sort_order: String(o.sort_order),
      volatility_level: o.volatility_level ?? "", volatility_note: o.volatility_note ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const isEdit = !!editTarget;
    const payload = {
      ...(isEdit ? { id: editTarget.id } : {}),
      ...form,
      category_id: form.category_id || null,
      pool_id: form.pool_id || null,
    };
    const res = await fetch("/api/admin/opportunities", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error || "Failed.");
    } else {
      showToast("success", isEdit ? `"${form.title}" updated.` : `"${form.title}" created.`);
      setShowForm(false);
      setEditTarget(null);
      setForm(emptyForm);
      fetchAll();
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/opportunities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      setOpportunities(prev => prev.filter(o => o.id !== deleteTarget.id));
      showToast("success", `"${deleteTarget.title}" deleted.`);
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const toggleVisibility = async (o: Opportunity, field: "is_public" | "is_for_investor") => {
    const res = await fetch("/api/admin/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: o.id, [field]: !o[field] }),
    });
    if (res.ok) {
      setOpportunities(prev => prev.map(x => x.id === o.id ? { ...x, [field]: !o[field] } : x));
    }
  };

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm";
  const labelCls = "block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-[#05CE78]" /> Opportunities
          </h1>
          <p className="text-sm text-gray-500 mt-1">{opportunities.length} total · manage public and investor-facing listings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv(`opportunities-${new Date().toISOString().split("T")[0]}.csv`, filtered, [
              { key: "title", label: "Title" },
              { key: "status", label: "Status" },
              { key: "min_investment", label: "Min Investment" },
              { key: "target_irr", label: "Target IRR %" },
              { key: "tenure", label: "Tenure" },
              { key: "is_public", label: "Public" },
              { key: "is_for_investor", label: "For Investor" },
            ])}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-900/20 text-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Add Opportunity
          </button>
        </div>
      </div>

      {toast && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${toast.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
          <button onClick={clearToast} className="ml-auto opacity-50 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Category dropdown */}
        <div className="relative">
          <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
            className="pl-8 pr-8 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#05CE78] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_8px_center]"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {TYPE_FILTERS.map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${typeFilter === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities..."
            className="pl-9 py-2 pr-4 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-64" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">{search ? `No results for "${search}"` : "No opportunities yet."}</div>
        ) : (
          <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[23%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
                <col className="w-[7%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th onClick={() => handleSort("title")} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900">
                    <span className="flex items-center gap-1">Opportunity <SortIcon column="title" sortKey={sortKey} sortDir={sortDir} /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th onClick={() => handleSort("min_investment")} className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900">
                    <span className="flex items-center justify-end gap-1">Min. Invest <SortIcon column="min_investment" sortKey={sortKey} sortDir={sortDir} /></span>
                  </th>
                  <th onClick={() => handleSort("target_irr")} className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900">
                    <span className="flex items-center justify-end gap-1">IRR <SortIcon column="target_irr" sortKey={sortKey} sortDir={sortDir} /></span>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Filled</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Inv.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(o => {
                  const filledPct = o.computed_filled_pct;
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{o.title}</p>
                        {o.tagline && <p className="text-xs text-gray-400 mt-0.5 truncate">{o.tagline}</p>}
                        {(o.pool_name || o.company_name) && (
                          <p className="text-xs text-[#05CE78] mt-0.5 flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 shrink-0" /> {o.pool_name ?? o.company_name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {o.opportunity_categories
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-md border border-gray-200 truncate max-w-full"><Tag className="w-3 h-3 shrink-0" /><span className="truncate">{o.opportunity_categories.name}</span></span>
                          : <span className="text-gray-300 text-xs">-</span>}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-700 tabular-nums font-medium text-xs">
                        {o.min_investment != null ? formatCurrency(o.min_investment) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {o.target_irr != null
                          ? <span className="font-bold text-emerald-700">{o.target_irr}%</span>
                          : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {filledPct != null ? (
                          <div>
                            <span className="text-xs font-semibold text-gray-600">{filledPct.toFixed(0)}%</span>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${filledPct}%` }} />
                            </div>
                          </div>
                        ) : <span className="text-gray-300 text-xs">-</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => toggleVisibility(o, "is_public")} title={o.is_public ? "Visible on public site" : "Hidden from public site"} className="cursor-pointer">
                          {o.is_public
                            ? <Eye className="w-4 h-4 text-[#05CE78] mx-auto" />
                            : <EyeOff className="w-4 h-4 text-gray-300 mx-auto" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => toggleVisibility(o, "is_for_investor")} title={o.is_for_investor ? "Visible to investors" : "Hidden from investors"} className="cursor-pointer">
                          {o.is_for_investor
                            ? <Eye className="w-4 h-4 text-blue-500 mx-auto" />
                            : <EyeOff className="w-4 h-4 text-gray-300 mx-auto" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${STATUS_COLORS[o.status] ?? STATUS_COLORS.draft}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {o.volatility_level
                          ? <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${VOLATILITY_COLORS[o.volatility_level as VolatilityLevel] ?? "bg-gray-100 text-gray-500 border-gray-200"}`} title={o.volatility_note ?? undefined}>
                              {o.volatility_level}
                            </span>
                          : <span className="text-gray-300 text-xs">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {o.brochure_url && (
                            <a href={o.brochure_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View brochure">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {o.pool_id && (
                            <button onClick={() => openLinkedInvestments(o)} className="p-1.5 text-gray-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer" title="View linked investments"><Users className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => openEdit(o)} className="p-1.5 text-gray-400 hover:text-[#05CE78] hover:bg-green-50 rounded-lg transition-colors cursor-pointer" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget(o)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !submitting && setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900 text-lg">{editTarget ? "Edit Opportunity" : "New Opportunity"}</h3>
              <button onClick={() => setShowForm(false)} disabled={submitting} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Title *</label>
                  <input type="text" value={form.title} required
                    onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: editTarget ? f.slug : slugify(e.target.value) }))}
                    placeholder="e.g. Pool 6 - Intercity Fleet" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Category</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className={inputCls}>
                    <option value="">- No category -</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Tagline</label>
                  <input type="text" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                    placeholder="Short one-liner for cards" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Detailed opportunity description..." rows={3}
                    className={`${inputCls} resize-none`} />
                </div>
              </div>

              {/* Financials */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Financials</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Min. Investment (₹)</label>
                    <input type="number" value={form.min_investment} min={0} onChange={e => setForm(f => ({ ...f, min_investment: e.target.value }))} placeholder="500000" className={inputCls} />
                    {form.min_investment && <p className="text-xs text-gray-400 mt-1">{formatCurrency(Number(form.min_investment))}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Target IRR (%)</label>
                    <input type="number" value={form.target_irr} min={0} step="0.1" onChange={e => setForm(f => ({ ...f, target_irr: e.target.value }))} placeholder="22" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tenure</label>
                    <input type="text" value={form.tenure} onChange={e => setForm(f => ({ ...f, tenure: e.target.value }))} placeholder="3 years" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Total Pool Size (₹)</label>
                    <input type="number" value={form.total_pool_size} min={0} onChange={e => setForm(f => ({ ...f, total_pool_size: e.target.value }))} placeholder="10000000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Filled % <span className="normal-case text-gray-400 font-normal">(leave blank to auto-calc from pool)</span></label>
                    <input type="number" value={form.filled_pct} min={0} max={100} step="0.1" onChange={e => setForm(f => ({ ...f, filled_pct: e.target.value }))} placeholder="Auto" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pool / Company Link</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Link to Pool</label>
                    <select value={form.pool_id} onChange={e => setForm(f => ({ ...f, pool_id: e.target.value, company_name: e.target.value ? "" : f.company_name }))} className={inputCls}>
                      <option value="">- No pool -</option>
                      {pools.map(p => <option key={p.purchase_id} value={p.purchase_id}>{p.pool_name} · {p.status}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Or Company Name</label>
                    <input type="text" value={form.company_name} disabled={!!form.pool_id}
                      onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                      placeholder="e.g. Zostel Varanasi" className={`${inputCls} ${form.pool_id ? "opacity-40 cursor-not-allowed" : ""}`} />
                  </div>
                </div>
              </div>

              {/* Media */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Media & Links</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Card Image</label>
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
                    {form.image_url ? (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={form.image_url} alt="Card image preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                          className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-xs font-bold text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50">
                          {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Replace
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                        className="w-full h-28 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#05CE78] hover:bg-[#05CE78]/5 rounded-xl transition-colors cursor-pointer disabled:opacity-50">
                        {uploadingImage
                          ? <><Loader2 className="w-5 h-5 animate-spin text-gray-400" /><span className="text-xs font-bold text-gray-400">Uploading...</span></>
                          : <><ImageOff className="w-5 h-5 text-gray-300" /><span className="text-xs font-bold text-gray-400">Click to upload image</span></>}
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Brochure PDF</label>
                    <input ref={brochureInputRef} type="file" accept="application/pdf" onChange={handleBrochureUpload} className="hidden" />
                    {form.brochure_url ? (
                      <div className="w-full h-28 rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-2 relative group">
                        <FileText className="w-6 h-6 text-red-400" />
                        <a href={form.brochure_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline">View current brochure</a>
                        <button type="button" onClick={() => setForm(f => ({ ...f, brochure_url: "" }))}
                          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => brochureInputRef.current?.click()} disabled={uploadingBrochure}
                          className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-xs font-bold text-gray-700 rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50">
                          {uploadingBrochure ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Replace
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => brochureInputRef.current?.click()} disabled={uploadingBrochure}
                        className="w-full h-28 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#05CE78] hover:bg-[#05CE78]/5 rounded-xl transition-colors cursor-pointer disabled:opacity-50">
                        {uploadingBrochure
                          ? <><Loader2 className="w-5 h-5 animate-spin text-gray-400" /><span className="text-xs font-bold text-gray-400">Uploading...</span></>
                          : <><FileText className="w-5 h-5 text-gray-300" /><span className="text-xs font-bold text-gray-400">Click to upload PDF</span></>}
                      </button>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Detail Page URL <span className="text-gray-400 font-normal normal-case tracking-normal">(links the card CTA — use a relative path like /opportunities/transportation/pool-6 or an external URL. Building the actual page content is still a separate development task.)</span></label>
                    <input type="text" value={form.detail_url} onChange={e => setForm(f => ({ ...f, detail_url: e.target.value }))} placeholder="/opportunities/transportation/pool-6" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Risk & Volatility */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Risk & Volatility</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Volatility Level</label>
                    <div className="flex gap-2">
                      {(["", ...VOLATILITY_OPTIONS] as const).map(level => (
                        <button
                          key={level || "none"}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, volatility_level: level }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            form.volatility_level === level
                              ? level === ""
                                ? "bg-gray-200 text-gray-700 border-gray-300"
                                : level === "Low"   ? "bg-green-500 text-white border-green-500"
                                : level === "Medium"? "bg-amber-500 text-white border-amber-500"
                                : "bg-red-500 text-white border-red-500"
                              : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {level || "None"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Volatility Note <span className="normal-case text-gray-400 font-normal">(optional tooltip)</span></label>
                    <input
                      type="text"
                      value={form.volatility_note}
                      onChange={e => setForm(f => ({ ...f, volatility_note: e.target.value }))}
                      placeholder="e.g. Seasonal demand fluctuation"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Gallery & Contact */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Gallery & Contact</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Google Drive Folder ID <span className="text-gray-400 font-normal normal-case tracking-normal">(from folder URL — must be publicly shared)</span></label>
                    <input type="text" value={form.gallery_folder_id} onChange={e => setForm(f => ({ ...f, gallery_folder_id: e.target.value }))} placeholder="1ABC123xyz..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp Number <span className="text-gray-400 font-normal normal-case tracking-normal">(with country code, no spaces)</span></label>
                    <input type="text" value={form.whatsapp_number} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="919000272020" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Visibility & Status */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Visibility & Status</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
                        className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${form.is_public ? "bg-[#05CE78]" : "bg-gray-200"} flex items-center px-[3px]`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_public ? "translate-x-[18px]" : "translate-x-0"}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">Show on Public Site</p>
                        <p className="text-xs text-gray-400">Visible to anyone visiting the website</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div onClick={() => setForm(f => ({ ...f, is_for_investor: !f.is_for_investor }))}
                        className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${form.is_for_investor ? "bg-blue-500" : "bg-gray-200"} flex items-center px-[3px]`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_for_investor ? "translate-x-[18px]" : "translate-x-0"}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">Show in Investor Dashboard</p>
                        <p className="text-xs text-gray-400">Visible to logged-in investors</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-all disabled:opacity-60 cursor-pointer">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {editTarget ? "Save Changes" : "Create"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5 text-red-500" /></div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Delete Opportunity</h3>
                <p className="text-gray-500 text-sm mt-1">Delete <span className="font-semibold text-gray-900">"{deleteTarget.title}"</span>? This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors cursor-pointer">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Linked Investments Modal */}
      {investmentsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setInvestmentsTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-500" /> Linked Investments
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{investmentsTarget.title}</p>
              </div>
              <button onClick={() => setInvestmentsTarget(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {!investmentsTarget.pool_id ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No pool linked to this opportunity.</p>
                  <p className="text-xs mt-1">Link a pool to see associated investments.</p>
                </div>
              ) : loadingLinked ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
              ) : linkedInvestments.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No investments found for this pool yet.</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-violet-600 font-semibold">Total Investors</p>
                      <p className="text-xl font-black text-violet-700 mt-0.5">{linkedInvestments.length}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-emerald-600 font-semibold">Total Deployed</p>
                      <p className="text-xl font-black text-emerald-700 mt-0.5">
                        {formatCurrency(linkedInvestments.reduce((s, i) => s + Number(i.total_amount), 0))}
                      </p>
                    </div>
                  </div>

                  {/* Investor list */}
                  <div className="space-y-2">
                    {linkedInvestments.map(inv => (
                      <div key={inv.investment_id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{inv.investor_name}</p>
                          <p className="text-xs text-gray-400 truncate">{inv.email}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold text-gray-900 text-sm tabular-nums">{formatCurrency(inv.total_amount)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(inv.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
