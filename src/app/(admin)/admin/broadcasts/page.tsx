"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Mail, Megaphone, Send, ImagePlus, X, Loader2, CheckCircle2,
  Eye, EyeOff, Users, Clock, Download, Search,
  ChevronDown, ChevronUp, Info, AlertCircle, Phone, Video, Film, Maximize2, FileText,
} from "lucide-react";
import { exportToCsv } from "@/lib/exportCsv";
import { SortIcon } from "@/components/admin/SortIcon";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabaseClient";
import { compressVideo, VideoTooLargeToCompressError } from "@/lib/videoCompress";
import { compressImage } from "@/lib/imageCompress";

interface BroadcastLog {
  id: string;
  subject: string;
  body: string;
  image_urls: string[] | null;
  video_url: string | null;
  pdf_url: string | null;
  recipient_filter: { type: string; value?: string };
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  open_count: number;
  openers: string[];
  created_by: string;
  created_at: string;
}

interface Pool { purchase_id: string; pool_name: string; }
interface InvestorOption { investor_id: string; name: string; email: string; phone: string | null; }

// Manual contact row: email + optional phone for WA
interface ManualContact { email: string; phone: string; }

const FILTER_OPTIONS = [
  { value: "all", label: "All Investors" },
  { value: "active", label: "Active Investors" },
  { value: "exited", label: "Exited Investors" },
  { value: "pool", label: "By Pool" },
  { value: "select", label: "Select Investors" },
  { value: "manual", label: "External Contacts" },
];

type SortKey = "created_at" | "recipient_count" | "sent_count" | "subject";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB — enforced before compression/upload even starts
const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB — not compressed (no reliable client-side PDF compressor), just capped

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
type SortDir = "asc" | "desc";

export default function BroadcastsPage() {
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [allInvestors, setAllInvestors] = useState<InvestorOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Table controls
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "partial">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Compose modal
  const [showCompose, setShowCompose] = useState(false);
  const [channels, setChannels] = useState<{ email: boolean; whatsapp: boolean }>({ email: true, whatsapp: false });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoStage, setVideoStage] = useState<"loading-engine" | "compressing" | "uploading" | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoOriginalSize, setVideoOriginalSize] = useState<number | null>(null);
  const [videoCompressedSize, setVideoCompressedSize] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfSize, setPdfSize] = useState<number | null>(null);
  const [imageCompressing, setImageCompressing] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterPool, setFilterPool] = useState("");

  // Select Investors
  const [investorSearch, setInvestorSearch] = useState("");
  const [selectedInvestorIds, setSelectedInvestorIds] = useState<Set<string>>(new Set());

  // External Contacts (manual)
  const [manualContacts, setManualContacts] = useState<ManualContact[]>([{ email: "", phone: "" }]);

  const [showInvestorDropdown, setShowInvestorDropdown] = useState(false);
  const investorDropdownRef = useRef<HTMLDivElement>(null);

  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientEmails, setRecipientEmails] = useState<{ name: string; email: string; phone?: string }[]>([]);
  const [showEmailList, setShowEmailList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const { toast, showToast } = useToast();

  useEffect(() => { fetchLogs(); fetchPools(); fetchInvestors(); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (investorDropdownRef.current && !investorDropdownRef.current.contains(e.target as Node)) {
        setShowInvestorDropdown(false);
      }
    }
    if (showInvestorDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInvestorDropdown]);

  // Recompute recipients when filter changes
  useEffect(() => {
    if (!showCompose) return;
    setRecipientCount(null);
    setRecipientEmails([]);
    setShowEmailList(false);

    if (filterType === "manual") {
      const valid = manualContacts.filter(c => c.email.includes("@"));
      setRecipientCount(valid.length);
      setRecipientEmails(valid.map(c => ({ name: c.email.split("@")[0], email: c.email, phone: c.phone || undefined })));
      return;
    }

    if (filterType === "select") {
      const selected = allInvestors.filter(i => selectedInvestorIds.has(i.investor_id));
      setRecipientCount(selected.length);
      setRecipientEmails(selected.map(i => ({ name: i.name, email: i.email, phone: i.phone ?? undefined })));
      return;
    }

    if (filterType === "pool" && !filterPool) return;

    const params = new URLSearchParams({ type: filterType });
    if (filterType === "pool" && filterPool) params.set("value", filterPool);
    fetch(`/api/admin/broadcast?${params}`)
      .then(r => r.json())
      .then(d => { setRecipientCount(d.count ?? 0); setRecipientEmails(d.emails ?? []); })
      .catch(() => { });
  }, [filterType, filterPool, manualContacts, selectedInvestorIds, showCompose]);

  async function fetchLogs() {
    setLoading(true);
    const res = await fetch("/api/admin/broadcast/logs");
    if (res.ok) setLogs((await res.json()).logs ?? []);
    setLoading(false);
  }

  async function fetchPools() {
    const res = await fetch("/api/admin/pools");
    if (res.ok) setPools((await res.json()).pools ?? []);
  }

  async function fetchInvestors() {
    const res = await fetch("/api/admin/investors");
    if (res.ok) {
      const data = await res.json();
      setAllInvestors(
        (data.investors ?? []).map((inv: any) => ({
          investor_id: inv.investor_id,
          name: inv.investor_name ?? "",
          email: inv.email ?? "",
          phone: inv.phone ?? null,
        }))
      );
    }
  }

  const filteredInvestorOptions = useMemo(() => {
    if (!investorSearch.trim()) return allInvestors;
    const q = investorSearch.toLowerCase();
    return allInvestors.filter(i => i.name?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q));
  }, [allInvestors, investorSearch]);

  function toggleInvestor(id: string) {
    setSelectedInvestorIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    const visibleIds = filteredInvestorOptions.map(i => i.investor_id);
    const allSelected = visibleIds.every(id => selectedInvestorIds.has(id));
    setSelectedInvestorIds(prev => {
      const next = new Set(prev);
      allSelected ? visibleIds.forEach(id => next.delete(id)) : visibleIds.forEach(id => next.add(id));
      return next;
    });
  }

  function updateManualContact(index: number, field: keyof ManualContact, value: string) {
    setManualContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  }

  function addManualContact() {
    setManualContacts(prev => [...prev, { email: "", phone: "" }]);
  }

  function removeManualContact(index: number) {
    setManualContacts(prev => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setImageCompressing(true);
    const compressed = await compressImage(file);
    setImageCompressing(false);
    const fd = new FormData();
    fd.append("file", compressed);
    const res = await fetch("/api/admin/broadcast/upload-image", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setImageUrls(prev => [...prev, data.url]);
    else setComposeError(data.error ?? "Upload failed.");
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Compressed client-side (ffmpeg.wasm) first, then the (now much smaller)
  // file is uploaded straight from the browser to Supabase Storage via a
  // signed URL — our Next.js server never sees the bytes at any point.
  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setComposeError(`Video is ${formatMb(file.size)} — max allowed is ${formatMb(MAX_VIDEO_BYTES)}.`);
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    setVideoUploading(true);
    setComposeError(null);
    setVideoStage("compressing");
    setVideoProgress(0);
    setVideoOriginalSize(file.size);
    setVideoCompressedSize(null);

    let uploadFile = file;
    try {
      uploadFile = await compressVideo(file, {
        onStage: stage => setVideoStage(stage === "loading-engine" ? "loading-engine" : "compressing"),
        onProgress: setVideoProgress,
      });
      setVideoCompressedSize(uploadFile.size);
    } catch (err) {
      if (err instanceof VideoTooLargeToCompressError) {
        showToast("success", "Video is too large to compress in-browser — uploading the original file.");
      } else {
        console.error("[broadcasts] video compression failed, uploading original:", err);
        showToast("success", "Compression failed — uploading the original file instead.");
      }
      uploadFile = file; // fall back to the raw file rather than blocking the send
    }

    try {
      setVideoStage("uploading");
      const initRes = await fetch("/api/admin/broadcast/upload-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: uploadFile.name, fileType: uploadFile.type, fileSize: uploadFile.size }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error ?? "Could not start upload.");

      const { error: uploadError } = await supabase.storage
        .from("broadcast-videos")
        .uploadToSignedUrl(initData.path, initData.token, uploadFile, { contentType: uploadFile.type });
      if (uploadError) throw uploadError;

      setVideoUrl(initData.publicUrl);
      setVideoFileName(file.name);
    } catch (err: any) {
      setComposeError(err.message ?? "Video upload failed.");
      setVideoOriginalSize(null);
      setVideoCompressedSize(null);
    } finally {
      setVideoUploading(false);
      setVideoStage(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  // No compression step here (unlike video/images) — there's no reliable
  // client-side PDF compressor, so this just uploads the raw file straight
  // to Supabase via a signed URL, same as video.
  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PDF_BYTES) {
      setComposeError(`PDF is ${formatMb(file.size)} — max allowed is ${formatMb(MAX_PDF_BYTES)}.`);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      return;
    }
    setPdfUploading(true);
    setComposeError(null);
    try {
      const initRes = await fetch("/api/admin/broadcast/upload-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error ?? "Could not start upload.");

      const { error: uploadError } = await supabase.storage
        .from("broadcast-pdfs")
        .uploadToSignedUrl(initData.path, initData.token, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      setPdfUrl(initData.publicUrl);
      setPdfFileName(file.name);
      setPdfSize(file.size);
    } catch (err: any) {
      setComposeError(err.message ?? "PDF upload failed.");
    } finally {
      setPdfUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  async function handlePreview() {
    if (channels.email && !subject.trim()) return setComposeError("Subject is required for email.");
    setComposeError(null);
    setPreviewing(true);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, image_urls: imageUrls, video_url: videoUrl, pdf_url: pdfUrl, filter: buildFilter(), preview: true }),
    });
    const data = await res.json();
    setPreviewing(false);
    if (res.ok) setPreviewHtml(data.html);
    else setComposeError(data.error ?? "Preview failed.");
  }

  async function handleSend() {
    if (channels.email && !subject.trim()) return setComposeError("Subject is required for email.");
    if (!body.trim()) return setComposeError("Message body is required.");
    if (!Object.values(channels).some(Boolean)) return setComposeError("Select at least one channel.");
    if (!recipientCount) return setComposeError("No recipients found.");
    setComposeError(null);
    setSending(true);
    const selectedChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, image_urls: imageUrls, video_url: videoUrl, pdf_url: pdfUrl, filter: buildFilter(), channels: selectedChannels }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      const parts = [];
      if (data.email) parts.push(`Email: ${data.email.sent} sent${data.email.failed > 0 ? `, ${data.email.failed} failed` : ""}`);
      if (data.whatsapp) parts.push(`WhatsApp: ${data.whatsapp.sent} sent${data.whatsapp.failed > 0 ? `, ${data.whatsapp.failed} failed` : ""}${data.whatsapp.skipped > 0 ? `, ${data.whatsapp.skipped} skipped` : ""}`);
      showToast("success", parts.join(" · ") || "Broadcast sent.");
      resetCompose();
      fetchLogs();
    } else {
      setComposeError(data.error ?? "Send failed.");
    }
  }

  function buildFilter() {
    if (filterType === "pool") return { type: "pool", value: filterPool };
    if (filterType === "select") return { type: "select", value: [...selectedInvestorIds].join(",") };
    if (filterType === "manual") {
      const valid = manualContacts.filter(c => c.email.includes("@"));
      return { type: "manual", value: valid.map(c => `${c.email}|${c.phone}`).join(",") };
    }
    return { type: filterType };
  }

  function resetCompose() {
    setSubject(""); setBody(""); setImageUrls([]);
    setVideoUrl(null); setVideoFileName(null); setVideoUploading(false);
    setVideoStage(null); setVideoProgress(0); setVideoOriginalSize(null); setVideoCompressedSize(null);
    setPdfUrl(null); setPdfFileName(null); setPdfUploading(false); setPdfSize(null);
    setFilterType("all"); setFilterPool("");
    setSelectedInvestorIds(new Set()); setInvestorSearch(""); setShowInvestorDropdown(false);
    setManualContacts([{ email: "", phone: "" }]);
    setChannels({ email: true, whatsapp: false });
    setPreviewHtml(null); setComposeError(null);
    setShowEmailList(false); setShowCompose(false);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let rows = [...logs];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(l => l.subject.toLowerCase().includes(q) || l.created_by?.toLowerCase().includes(q));
    }
    if (statusFilter === "success") rows = rows.filter(l => l.failed_count === 0);
    if (statusFilter === "partial") rows = rows.filter(l => l.failed_count > 0);
    rows.sort((a, b) => {
      let av: any = a[sortKey], bv: any = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase(), bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return rows;
  }, [logs, search, statusFilter, sortKey, sortDir]);

  function handleExport() {
    exportToCsv(
      "broadcasts",
      filtered.map(l => ({
        subject: l.subject,
        recipient_filter: l.recipient_filter.type,
        recipient_count: l.recipient_count,
        sent_count: l.sent_count,
        failed_count: l.failed_count,
        open_count: l.open_count,
        created_by: l.created_by,
        created_at: new Date(l.created_at).toLocaleString("en-IN"),
      })),
      [
        { key: "subject", label: "Subject" },
        { key: "recipient_filter", label: "Filter" },
        { key: "recipient_count", label: "Recipients" },
        { key: "sent_count", label: "Sent" },
        { key: "failed_count", label: "Failed" },
        { key: "open_count", label: "Opens" },
        { key: "created_by", label: "Sent By" },
        { key: "created_at", label: "Date" },
      ]
    );
  }

  const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05CE78]/40 focus:border-[#05CE78] bg-white";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="p-8 space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border
          ${toast.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#05CE78]" /> Broadcasts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Send Email and WhatsApp messages to investors or external contacts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setShowCompose(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#05CE78] hover:bg-[#04b86c] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">
            <Send className="w-4 h-4" /> New Broadcast
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by subject or sender…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78]/40 focus:border-[#05CE78]" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {[{ key: "all", label: "All" }, { key: "success", label: "All Sent" }, { key: "partial", label: "With Failures" }].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key as any)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer
                ${statusFilter === f.key ? "bg-[#0B1120] text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left">
                  <button onClick={() => handleSort("subject")} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 cursor-pointer">
                    Subject <SortIcon column="subject" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter</th>
                <th className="px-6 py-3 text-right">
                  <button onClick={() => handleSort("recipient_count")} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 cursor-pointer ml-auto">
                    Recipients <SortIcon column="recipient_count" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-6 py-3 text-right">
                  <button onClick={() => handleSort("sent_count")} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 cursor-pointer ml-auto">
                    Sent <SortIcon column="sent_count" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Opens</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent By</th>
                <th className="px-6 py-3 text-right">
                  <button onClick={() => handleSort("created_at")} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 cursor-pointer ml-auto">
                    Date <SortIcon column="created_at" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">No broadcasts found.</td></tr>
              ) : filtered.map(log => (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${log.failed_count > 0 ? "bg-orange-50 text-orange-500" : "bg-green-50 text-[#05CE78]"}`}>
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-gray-900 truncate max-w-xs">{log.subject || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold capitalize">
                        {log.recipient_filter.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700 font-semibold">{log.recipient_count}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold text-green-700">{log.sent_count}</span>
                        {log.failed_count > 0 && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">{log.failed_count} failed</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.open_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                          <Eye className="w-3 h-3" />{log.open_count}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs truncate max-w-[140px]">{log.created_by}</td>
                    <td className="px-6 py-4 text-right text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      <div className="text-gray-400">{new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); setExpandedLog(expandedLog === log.id ? null : log.id); }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                        {expandedLog === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  {expandedLog === log.id && (
                    <tr>
                      <td colSpan={8} className="px-6 pb-5 bg-gray-50 border-b border-gray-100">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-2 space-y-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Message Body</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{log.body}</p>
                          {log.image_urls && log.image_urls.length > 0 && (
                            <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                              {log.image_urls.map((url, i) => (
                                <button key={i} type="button" onClick={() => setLightbox(url)}
                                  className="group relative cursor-pointer">
                                  <img src={url} alt="" className="h-20 w-20 object-cover rounded-lg border border-gray-200 group-hover:opacity-80 transition-opacity" />
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors">
                                    <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                          {log.video_url && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /> Video</p>
                              <a
                                href={log.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                <Video className="w-3.5 h-3.5" /> View Video
                              </a>
                            </div>
                          )}
                          {log.pdf_url && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Document</p>
                              <a
                                href={log.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" /> View Document
                              </a>
                            </div>
                          )}
                          {log.openers && log.openers.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Opened by ({log.openers.length})</p>
                              <div className="flex flex-wrap gap-1.5">
                                {log.openers.map(email => (
                                  <span key={email} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2 py-0.5">
                                    <Eye className="w-3 h-3" />{email}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            Showing {filtered.length} broadcast{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ─── Compose Modal ──────────────────────────────────────────────────── */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-8">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#05CE78]" /> New Broadcast
              </h2>
              <button onClick={resetCompose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Channels */}
              <div>
                <label className={labelCls}>Channels</label>
                <div className="flex items-center gap-3">
                  {[
                    { key: "email", label: "Email", color: "bg-blue-500" },
                    { key: "whatsapp", label: "WhatsApp", color: "bg-green-500" },
                  ].map(ch => (
                    <button key={ch.key} type="button"
                      onClick={() => setChannels(prev => ({ ...prev, [ch.key]: !prev[ch.key as keyof typeof prev] }))}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer
                        ${channels[ch.key as keyof typeof channels]
                          ? `${ch.color} text-white border-transparent`
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                      {channels[ch.key as keyof typeof channels] && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {ch.label}
                    </button>
                  ))}
                </div>
                {channels.whatsapp && !channels.email && (
                  <p className="text-xs text-amber-600 mt-1.5">WhatsApp only — Subject not required. Investors without a phone number will be skipped.</p>
                )}
                {channels.whatsapp && channels.email && (
                  <p className="text-xs text-gray-400 mt-1.5">Both channels — investors without a phone number will only receive email.</p>
                )}
              </div>

              {/* Recipients */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Send To</label>
                  <select value={filterType} onChange={e => { setFilterType(e.target.value); setFilterPool(""); setSelectedInvestorIds(new Set()); setShowInvestorDropdown(false); }} className={inputCls}>
                    {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {filterType === "pool" && (
                  <div>
                    <label className={labelCls}>Pool</label>
                    <select value={filterPool} onChange={e => setFilterPool(e.target.value)} className={inputCls}>
                      <option value="">Select pool…</option>
                      {pools.map(p => <option key={p.purchase_id} value={p.purchase_id}>{p.pool_name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Select Investors — dropdown checklist */}
              {filterType === "select" && (
                <div ref={investorDropdownRef} className="relative">
                  <label className={labelCls}>Select Investors</label>
                  <button type="button" onClick={() => setShowInvestorDropdown(v => !v)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm border rounded-xl bg-white transition-colors cursor-pointer
                      ${showInvestorDropdown ? "border-[#05CE78] ring-2 ring-[#05CE78]/40" : "border-gray-200 hover:border-gray-300"}`}>
                    <span className={selectedInvestorIds.size > 0 ? "text-gray-900 font-medium" : "text-gray-400"}>
                      {selectedInvestorIds.size > 0 ? `${selectedInvestorIds.size} investor${selectedInvestorIds.size !== 1 ? "s" : ""} selected` : "Choose investors…"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showInvestorDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showInvestorDropdown && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {/* Search */}
                      <div className="relative border-b border-gray-100">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={investorSearch} onChange={e => setInvestorSearch(e.target.value)}
                          placeholder="Search by name or email…"
                          className="w-full pl-9 pr-4 py-2.5 text-sm focus:outline-none bg-gray-50" autoFocus />
                      </div>
                      {/* Select all */}
                      {filteredInvestorOptions.length > 0 && (
                        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                          <input type="checkbox"
                            checked={filteredInvestorOptions.every(i => selectedInvestorIds.has(i.investor_id))}
                            onChange={toggleAllVisible}
                            className="accent-[#05CE78] w-4 h-4 cursor-pointer" />
                          <span className="text-xs font-semibold text-gray-500">Select all visible ({filteredInvestorOptions.length})</span>
                        </div>
                      )}
                      {/* List */}
                      <div className="max-h-52 overflow-y-auto">
                        {filteredInvestorOptions.length === 0 ? (
                          <p className="px-4 py-6 text-center text-xs text-gray-400">No investors found.</p>
                        ) : filteredInvestorOptions.map(inv => (
                          <label key={inv.investor_id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                            <input type="checkbox"
                              checked={selectedInvestorIds.has(inv.investor_id)}
                              onChange={() => toggleInvestor(inv.investor_id)}
                              className="accent-[#05CE78] w-4 h-4 cursor-pointer shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{inv.name}</p>
                              <p className="text-xs text-gray-400 truncate">{inv.email}{inv.phone ? ` · ${inv.phone}` : ""}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      {/* Done button */}
                      {selectedInvestorIds.size > 0 && (
                        <div className="px-3 py-2.5 border-t border-gray-100 bg-gray-50">
                          <button type="button" onClick={() => setShowInvestorDropdown(false)}
                            className="w-full py-1.5 text-xs font-bold text-white bg-[#05CE78] hover:bg-[#04b86c] rounded-lg transition-colors cursor-pointer">
                            Done — {selectedInvestorIds.size} selected
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* External Contacts — email + phone rows */}
              {filterType === "manual" && (
                <div>
                  <label className={labelCls}>External Contacts</label>
                  <div className="space-y-2">
                    {manualContacts.map((contact, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input type="email" value={contact.email}
                            onChange={e => updateManualContact(i, "email", e.target.value)}
                            placeholder="email@example.com"
                            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05CE78]/40 focus:border-[#05CE78] bg-white" />
                        </div>
                        {channels.whatsapp && (
                          <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="tel" value={contact.phone}
                              onChange={e => updateManualContact(i, "phone", e.target.value)}
                              placeholder="91XXXXXXXXXX"
                              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05CE78]/40 focus:border-[#05CE78] bg-white" />
                          </div>
                        )}
                        <button onClick={() => removeManualContact(i)} disabled={manualContacts.length === 1}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addManualContact}
                      className="text-xs font-semibold text-[#05CE78] hover:text-[#04b86c] flex items-center gap-1 cursor-pointer mt-1">
                      + Add another contact
                    </button>
                  </div>
                  {channels.whatsapp && <p className="text-xs text-gray-400 mt-1.5">Phone numbers in international format without + (e.g. 919876543210)</p>}
                </div>
              )}

              {/* Recipient count + verify list (shown for all filter types when count is known) */}
              {recipientCount !== null && (filterType !== "pool" || filterPool) && (
                <div className="relative">
                  <button onClick={() => setShowEmailList(!showEmailList)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                    <Users className="w-3.5 h-3.5" />
                    {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                    <Info className="w-3 h-3 opacity-60" />
                    <span className="opacity-60">{showEmailList ? "hide" : `verify ${channels.whatsapp ? "email & phone" : "emails"}`}</span>
                  </button>
                  {showEmailList && recipientEmails.length > 0 && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl sticky top-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recipient List</p>
                          {channels.whatsapp && (
                            <p className="text-xs text-gray-400">
                              {recipientEmails.filter(r => r.phone).length} with phone · {recipientEmails.filter(r => !r.phone).length} email only
                            </p>
                          )}
                        </div>
                      </div>
                      {recipientEmails.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <span className="text-xs font-medium text-gray-700 w-32 truncate">{r.name}</span>
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="text-xs text-gray-500 font-mono truncate">{r.email}</span>
                            {channels.whatsapp && (
                              r.phone
                                ? <span className="text-xs text-green-600 font-mono shrink-0">{r.phone}</span>
                                : <span className="text-xs text-gray-300 shrink-0">no phone</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subject — only for email */}
              {channels.email && (
                <div>
                  <label className={labelCls}>Subject *</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Q1 Payout Update — Hustlers Ventures" className={inputCls} />
                </div>
              )}

              {/* Body */}
              <div>
                <label className={labelCls}>Message *</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={7}
                  placeholder={"Hi,\n\nYour Q1 payouts have been processed and credited to your account.\n\nThank you,\nHustlers Ventures Team"}
                  className={`${inputCls} resize-y font-mono text-sm leading-relaxed`} />
                <p className="text-xs text-gray-400 mt-1">Plain text — blank lines create paragraphs in email. This text is also sent as the WhatsApp message body.</p>
              </div>

              {/* Images — email only */}
              {channels.email && (
                <div>
                  <label className={labelCls}>Images <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                  <div className="flex flex-wrap gap-3">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                        <button onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#05CE78] hover:text-[#05CE78] transition-colors cursor-pointer disabled:opacity-50">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                      <span className="text-xs font-medium text-center leading-tight">{imageCompressing ? "…" : uploading ? "…" : "Add"}</span>
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <p className="text-xs text-gray-400 mt-1.5">Automatically compressed (downscaled + re-encoded) before upload.</p>
                </div>
              )}

              {/* Video — compressed in-browser before upload, email CTA link + WhatsApp link, no client-side size/length limit */}
              {(channels.email || channels.whatsapp) && (
                <div>
                  <label className={labelCls}>Video <span className="font-normal normal-case text-gray-400">(optional — max 50MB, compressed automatically before upload)</span></label>
                  {videoUploading ? (
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Loader2 className="w-4 h-4 animate-spin text-[#05CE78]" />
                        {videoStage === "loading-engine" && "Loading compression engine (first time only)…"}
                        {videoStage === "compressing" && `Compressing video… ${Math.round(videoProgress * 100)}%`}
                        {videoStage === "uploading" && "Uploading…"}
                      </div>
                      {videoStage === "compressing" && (
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#05CE78] transition-all duration-200" style={{ width: `${Math.round(videoProgress * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  ) : videoUrl ? (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50">
                      <div className="w-10 h-10 rounded-lg bg-[#05CE78]/10 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-[#05CE78]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{videoFileName}</p>
                        <p className="text-xs text-gray-400">
                          {videoOriginalSize && videoCompressedSize
                            ? `${formatMb(videoOriginalSize)} → ${formatMb(videoCompressedSize)} compressed`
                            : "Uploaded"} —{" "}
                          <a
                            href={videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                          >
                            View Video
                          </a>
                          {/* {" "}— will appear as a &ldquo;Watch Video&rdquo; button in the email. */}
                        </p>
                      </div>
                      <button onClick={() => { setVideoUrl(null); setVideoFileName(null); setVideoOriginalSize(null); setVideoCompressedSize(null); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => videoInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-[#05CE78] hover:text-[#05CE78] transition-colors cursor-pointer">
                      <Video className="w-4 h-4" />
                      <span className="text-sm font-medium">Upload a video (max 50MB)</span>
                    </button>
                  )}
                  <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-matroska" onChange={handleVideoUpload} className="hidden" />
                </div>
              )}

              {/* Document (PDF) — email CTA link + WhatsApp link, no compression (nothing reliable exists client-side for PDFs) */}
              {(channels.email || channels.whatsapp) && (
                <div>
                  <label className={labelCls}>Document <span className="font-normal normal-case text-gray-400">(optional — PDF only, max 20MB, not compressed)</span></label>
                  {pdfUploading ? (
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Loader2 className="w-4 h-4 animate-spin text-[#05CE78]" />
                        Uploading…
                      </div>
                    </div>
                  ) : pdfUrl ? (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50">
                      <div className="w-10 h-10 rounded-lg bg-[#05CE78]/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#05CE78]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{pdfFileName}</p>
                        <p className="text-xs text-gray-400">
                          {pdfSize ? formatMb(pdfSize) : "Uploaded"} —{" "}
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                            View Document
                          </a>
                        </p>
                      </div>
                      <button onClick={() => { setPdfUrl(null); setPdfFileName(null); setPdfSize(null); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => pdfInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-[#05CE78] hover:text-[#05CE78] transition-colors cursor-pointer">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Upload a PDF (max 20MB)</span>
                    </button>
                  )}
                  <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                </div>
              )}

              {/* Error */}
              {composeError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {composeError}
                </div>
              )}
            </div>

            {/* Preview */}
            {previewHtml && (
              <div className="border-t border-gray-100">
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Preview</span>
                  <button onClick={() => setPreviewHtml(null)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer">
                    <EyeOff className="w-3.5 h-3.5" /> Hide
                  </button>
                </div>
                <iframe srcDoc={previewHtml} className="w-full h-80 border-0" title="Email Preview" />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={handlePreview} disabled={previewing || !body.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer">
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Preview
              </button>
              <div className="flex items-center gap-3">
                <button onClick={resetCompose} className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
                <button onClick={handleSend}
                  disabled={sending || videoUploading || pdfUploading || (channels.email && !subject.trim()) || !body.trim() || !recipientCount || !Object.values(channels).some(Boolean)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#05CE78] hover:bg-[#04b86c] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Sending…" : `Send to ${recipientCount ?? "…"} recipient${recipientCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Media Lightbox ─────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img src={lightbox} alt="" onClick={e => e.stopPropagation()} className="max-w-full max-h-full rounded-xl object-contain cursor-default" />
        </div>
      )}
    </div>
  );
}
