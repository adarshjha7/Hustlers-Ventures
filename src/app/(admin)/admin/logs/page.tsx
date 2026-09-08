"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ScrollText, Loader2, RefreshCw, ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, Search, X, User, LogIn, Download, FileText } from "lucide-react";
import { exportToCsv } from "@/lib/exportCsv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LogEntry {
  id: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  metadata: Record<string, unknown> | null;
  investor: { name: string; email: string } | null;
  created_at: string;
}

interface LoginReportRow {
  investor_id: string;
  investor_name: string;
  associate_name: string | null;
  email: string;
  is_active: boolean;
  loggedIn: boolean;
  lastSignInAt: string | null;
}

type SortKey = "investor_name" | "associate_name" | "loggedIn" | "lastSignInAt";

const LEVEL_STYLES: Record<string, string> = {
  INFO:  "bg-blue-50 text-blue-700 border-blue-100",
  WARN:  "bg-orange-50 text-orange-600 border-orange-100",
  ERROR: "bg-red-50 text-red-600 border-red-100",
};

const LEVEL_DOT: Record<string, string> = {
  INFO:  "bg-blue-400",
  WARN:  "bg-orange-400",
  ERROR: "bg-red-500",
};

function MetadataCell({ metadata }: { metadata: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-gray-300 text-xs">-</span>;
  }
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors font-mono"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {open ? "hide" : "show"}
      </button>
      {open && (
        <pre className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100 overflow-x-auto max-w-xs leading-relaxed">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}

function generateLoginReportPDF(rows: LoginReportRow[]) {
  const doc = new jsPDF();

  doc.setFontSize(24); doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30); doc.text("HUSTLERS", 14, 22);
  doc.setTextColor(5, 206, 120); doc.text("VENTURES", 14, 30);
  doc.setFontSize(16); doc.setTextColor(30, 30, 30);
  doc.text("Investor Login Report", 196, 22, { align: "right" });
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}`, 196, 30, { align: "right" });
  doc.setDrawColor(230, 230, 230); doc.line(14, 38, 196, 38);

  const loggedInCount = rows.filter(r => r.loggedIn).length;
  doc.setFontSize(10); doc.setTextColor(100, 100, 100);
  doc.text(`${rows.length} investors · ${loggedInCount} logged in · ${rows.length - loggedInCount} never logged in`, 14, 46);

  autoTable(doc, {
    startY: 52,
    head: [["Investor", "Associate Name", "Status", "Last Login"]],
    body: rows.map(r => [
      r.investor_name,
      r.associate_name || "-",
      r.loggedIn ? "Logged In" : "Never Logged In",
      r.lastSignInAt
        ? new Date(r.lastSignInAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
        : "-",
    ]),
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255, fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 4, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 250, 249] },
  });

  doc.save(`investor-login-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

type LevelFilter = "" | "INFO" | "WARN" | "ERROR";

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<"system" | "login-report">("system");

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [level, setLevel] = useState<LevelFilter>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [investorSearch, setInvestorSearch] = useState("");
  const [debouncedInvestor, setDebouncedInvestor] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // --- Login Report state ---
  const [reportRows, setReportRows] = useState<LoginReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState<"" | "logged-in" | "never">("");
  const [sortKey, setSortKey] = useState<SortKey>("lastSignInAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchLoginReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await fetch("/api/admin/logs/login-report");
      const data = await res.json();
      setReportRows(data.report ?? []);
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "login-report" && reportRows.length === 0) fetchLoginReport();
  }, [activeTab, reportRows.length, fetchLoginReport]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) { setSortDir(d => (d === "asc" ? "desc" : "asc")); }
    else { setSortKey(key); setSortDir(key === "lastSignInAt" ? "desc" : "asc"); }
  };

  const filteredReportRows = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    let rows = reportRows.filter(r => {
      const matchesSearch = !q
        || r.investor_name.toLowerCase().includes(q)
        || (r.associate_name ?? "").toLowerCase().includes(q)
        || r.email.toLowerCase().includes(q);
      const matchesStatus =
        reportStatusFilter === "" ||
        (reportStatusFilter === "logged-in" && r.loggedIn) ||
        (reportStatusFilter === "never" && !r.loggedIn);
      return matchesSearch && matchesStatus;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "loggedIn") cmp = Number(a.loggedIn) - Number(b.loggedIn);
      else if (sortKey === "lastSignInAt") cmp = (a.lastSignInAt ?? "").localeCompare(b.lastSignInAt ?? "");
      else cmp = (a[sortKey] ?? "").localeCompare(b[sortKey] ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [reportRows, reportSearch, reportStatusFilter, sortKey, sortDir]);

  const handleExportReport = () => {
    exportToCsv(
      `investor-login-report-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredReportRows.map(r => ({
        associate_name: r.associate_name ?? "",
        investor_name: r.investor_name,
        status: r.loggedIn ? "Logged In" : "Never Logged In",
        last_login: r.lastSignInAt ? new Date(r.lastSignInAt).toLocaleString("en-IN") : "",
      })),
      [
        { key: "investor_name", label: "Investor Name" },
        { key: "associate_name", label: "Associate Name" },
        { key: "status", label: "Status" },
        { key: "last_login", label: "Last Login" },
      ]
    );
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey !== col ? <ChevronsUpDown className="w-3 h-3 text-gray-300" /> : sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />;
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const investorRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setDebouncedSearch(value); setPage(1); }, 350);
  };

  const handleInvestorChange = (value: string) => {
    setInvestorSearch(value);
    if (investorRef.current) clearTimeout(investorRef.current);
    investorRef.current = setTimeout(() => { setDebouncedInvestor(value); setPage(1); }, 350);
  };

  const fetchLogs = useCallback(async (p: number, lv: LevelFilter, q: string, inv: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (lv) params.set("level", lv);
    if (q) params.set("search", q);
    if (inv) params.set("investor", inv);
    const res = await fetch(`/api/admin/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchLogs(page, level, debouncedSearch, debouncedInvestor); }, [page, level, debouncedSearch, debouncedInvestor, fetchLogs]);

  const handleLevelChange = (lv: LevelFilter) => { setLevel(lv); setPage(1); };

  const handleRefresh = () => fetchLogs(page, level, debouncedSearch, debouncedInvestor, true);

  const isFiltered = debouncedSearch || debouncedInvestor;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "…")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {activeTab === "system" ? (
              <><ScrollText className="w-6 h-6 text-[#05CE78]" /> System Logs</>
            ) : (
              <><LogIn className="w-6 h-6 text-[#05CE78]" /> Investor Login Report</>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            {activeTab === "system" ? (
              <>
                {total.toLocaleString()} total entries
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                  Retained for 30 days
                </span>
              </>
            ) : (
              <>{filteredReportRows.length.toLocaleString()} investor{filteredReportRows.length !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "login-report" && (
            <>
              <button
                onClick={() => generateLoginReportPDF(filteredReportRows)}
                disabled={reportLoading || filteredReportRows.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={handleExportReport}
                disabled={reportLoading || filteredReportRows.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </>
          )}
          <button
            onClick={activeTab === "system" ? handleRefresh : fetchLoginReport}
            disabled={activeTab === "system" ? refreshing : reportLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${(activeTab === "system" ? refreshing : reportLoading) ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([
          { id: "system" as const, label: "System Logs" },
          { id: "login-report" as const, label: "Login Report" },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-[#05CE78] text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "system" && (
      <>
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Level filter */}
        <div className="flex gap-1">
          {(["", "INFO", "WARN", "ERROR"] as LevelFilter[]).map(lv => (
            <button
              key={lv || "ALL"}
              onClick={() => handleLevelChange(lv)}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                level === lv
                  ? "bg-[#0B1120] text-white border-[#0B1120]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {lv || "All Levels"}
            </button>
          ))}
        </div>

        {/* Investor search */}
        <div className="relative ml-auto">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={investorSearch}
            onChange={e => handleInvestorChange(e.target.value)}
            placeholder="Filter by investor name or email..."
            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-72"
          />
          {investorSearch && (
            <button
              onClick={() => { setInvestorSearch(""); setDebouncedInvestor(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Message search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-56"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {isFiltered ? "No logs matching your filters." : "No log entries found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Investor</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                      <div>{new Date(log.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      <div className="text-gray-400">{new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${LEVEL_STYLES[log.level] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[log.level] ?? "bg-gray-400"}`} />
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 max-w-md">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.investor ? (
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{log.investor.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{log.investor.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <MetadataCell metadata={log.metadata} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              Page <span className="font-semibold text-gray-600">{page}</span> of <span className="font-semibold text-gray-600">{totalPages}</span>
              {isFiltered && <span className="ml-1">· filtered</span>}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {pages.map((p, i) =>
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
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {activeTab === "login-report" && (
        <>
          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex gap-1">
              {([
                { id: "" as const, label: "All" },
                { id: "logged-in" as const, label: "Logged In" },
                { id: "never" as const, label: "Never Logged In" },
              ]).map(f => (
                <button
                  key={f.id || "ALL"}
                  onClick={() => setReportStatusFilter(f.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                    reportStatusFilter === f.id
                      ? "bg-[#0B1120] text-white border-[#0B1120]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={reportSearch}
                onChange={e => setReportSearch(e.target.value)}
                placeholder="Search by associate or investor name..."
                className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:bg-white transition-all w-80"
              />
              {reportSearch && (
                <button
                  onClick={() => setReportSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {reportLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" /></div>
            ) : filteredReportRows.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                {reportSearch || reportStatusFilter ? "No investors matching your filters." : "No investors found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <button onClick={() => handleSort("investor_name")} className="flex items-center gap-1 hover:text-gray-800">
                          Investor <SortIcon col="investor_name" />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <button onClick={() => handleSort("associate_name")} className="flex items-center gap-1 hover:text-gray-800">
                          Associate Name <SortIcon col="associate_name" />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <button onClick={() => handleSort("loggedIn")} className="flex items-center gap-1 hover:text-gray-800">
                          Status <SortIcon col="loggedIn" />
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        <button onClick={() => handleSort("lastSignInAt")} className="flex items-center gap-1 hover:text-gray-800">
                          Last Login <SortIcon col="lastSignInAt" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredReportRows.map(row => (
                      <tr key={row.investor_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-800">
                          {row.investor_name}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {row.associate_name || <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {row.loggedIn ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Logged In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border bg-gray-50 text-gray-500 border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> Never Logged In
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                          {row.lastSignInAt ? (
                            <>
                              <div>{new Date(row.lastSignInAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                              <div className="text-gray-400">{new Date(row.lastSignInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</div>
                            </>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
