"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Tag, Plus, Pencil, Trash2, Loader2, X, Save, CheckCircle2, AlertCircle, Search, Upload, ImageOff } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { SortIcon } from "@/components/admin/SortIcon";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
  volatility_level: string | null;
  created_at: string;
}

const VOLATILITY_OPTIONS = ["Low", "Medium", "High"] as const;
type VolatilityLevel = typeof VOLATILITY_OPTIONS[number];
const VOLATILITY_COLORS: Record<VolatilityLevel, string> = {
  Low:    "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High:   "bg-red-50 text-red-600 border-red-200",
};

const emptyForm = { name: "", slug: "", description: "", image_url: "", volatility_level: "", sort_order: "0" };

type SortKey = "name" | "description" | "volatility_level";

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function OpportunityCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { toast, showToast, clearToast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/opportunity-categories/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed.");
      setForm(f => ({ ...f, image_url: data.url }));
    } catch (err: any) {
      showToast("error", err?.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/opportunity-categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...categories]
      .filter(c => {
        const matchSearch = !q || c.name.toLowerCase().includes(q) || c.slug.includes(q);
        const matchStatus = statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active);
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const av = (a[sortKey] ?? "").toLowerCase();
        const bv = (b[sortKey] ?? "").toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [categories, search, statusFilter, sortKey, sortDir]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const isEdit = !!editTarget;
    const res = await fetch("/api/admin/opportunity-categories", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: editTarget.id, ...form } : form),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error || "Failed.");
    } else {
      showToast("success", isEdit ? `"${form.name}" updated.` : `"${form.name}" created.`);
      setShowModal(false);
      setEditTarget(null);
      setForm(emptyForm);
      fetchCategories();
    }
    setSubmitting(false);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "", image_url: cat.image_url ?? "", volatility_level: cat.volatility_level ?? "", sort_order: String(cat.sort_order ?? 0) });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/opportunity-categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.error);
    } else {
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      showToast("success", `"${deleteTarget.name}" deleted.`);
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const toggleActive = async (cat: Category) => {
    setTogglingId(cat.id);
    const res = await fetch("/api/admin/opportunity-categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id, is_active: !cat.is_active }),
    });
    if (res.ok) setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
    setTogglingId(null);
  };

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all text-sm";

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#05CE78]" /> Opportunity Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage verticals shown on the public site and investor dashboard.</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setForm(emptyForm); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-900/20 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${toast.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
          <button onClick={clearToast} className="ml-auto opacity-50 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <p className="font-bold text-gray-900 text-sm">{filtered.length} of {categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(["all", "active", "inactive"] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${statusFilter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}>
                  {f === "all" ? "All" : f === "active" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-48" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">{search || statusFilter !== "all" ? "No categories match your filter." : "No categories yet. Add one to get started."}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th onClick={() => handleSort("name")} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900">
                  <span className="flex items-center gap-1">Name <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th onClick={() => handleSort("description")} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900">
                  <span className="flex items-center gap-1">Description <SortIcon column="description" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th onClick={() => handleSort("volatility_level")} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900">
                  <span className="flex items-center gap-1">Risk Level <SortIcon column="volatility_level" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{cat.slug}</p>
                  </td>
                  <td className="px-6 py-4 max-w-[220px]">
                    {cat.description
                      ? <p className="text-sm text-gray-500 truncate cursor-default" title={cat.description}>{cat.description}</p>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {cat.volatility_level
                      ? <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${VOLATILITY_COLORS[cat.volatility_level as VolatilityLevel] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>{cat.volatility_level}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleActive(cat)} disabled={togglingId === cat.id} className="cursor-pointer">
                      {togglingId === cat.id
                        ? <Loader2 className="w-4 h-4 animate-spin text-gray-300 mx-auto" />
                        : <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-[3px] mx-auto ${cat.is_active ? "bg-[#05CE78]" : "bg-gray-200"}`}>
                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${cat.is_active ? "translate-x-[16px]" : "translate-x-0"}`} />
                          </div>
                      }
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-[#05CE78] hover:bg-green-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(cat)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{editTarget ? "Edit Category" : "New Category"}</h3>
                {editTarget && <p className="text-xs text-gray-400 mt-0.5">{editTarget.slug}</p>}
              </div>
              <button onClick={() => { setShowModal(false); setEditTarget(null); setForm(emptyForm); }} disabled={submitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Name *</label>
                <input type="text" value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editTarget ? f.slug : slugify(e.target.value) }))}
                  placeholder="e.g. Transportation" autoFocus className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Description</label>
                <input type="text" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description shown on the category card" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Thumbnail Image</label>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
                {form.image_url ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={form.image_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-xs font-bold text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50">
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Replace
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                    className="w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#05CE78] hover:bg-[#05CE78]/5 rounded-xl transition-colors cursor-pointer disabled:opacity-50">
                    {uploadingImage
                      ? <><Loader2 className="w-5 h-5 animate-spin text-gray-400" /><span className="text-xs font-bold text-gray-400">Uploading...</span></>
                      : <><ImageOff className="w-5 h-5 text-gray-300" /><span className="text-xs font-bold text-gray-400">Click to upload thumbnail</span></>}
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Risk Level</label>
                <div className="flex gap-2">
                  {(["", ...VOLATILITY_OPTIONS] as const).map(level => (
                    <button key={level || "none"} type="button"
                      onClick={() => setForm(f => ({ ...f, volatility_level: level }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        form.volatility_level === level
                          ? level === "" ? "bg-gray-200 text-gray-700 border-gray-300"
                            : level === "Low"    ? "bg-green-500 text-white border-green-500"
                            : level === "Medium" ? "bg-amber-500 text-white border-amber-500"
                            : "bg-red-500 text-white border-red-500"
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                      }`}>
                      {level || "None"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Sort Order <span className="text-gray-400 font-normal normal-case tracking-normal">(lower shows first on the Opportunities page)</span>
                </label>
                <input type="number" value={form.sort_order} min={0}
                  onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowModal(false); setEditTarget(null); setForm(emptyForm); }} disabled={submitting}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !form.name || !form.slug}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {editTarget ? "Save Changes" : "Create"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Delete Category</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Delete <span className="font-semibold text-gray-900">"{deleteTarget.name}"</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-red-900/20">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
