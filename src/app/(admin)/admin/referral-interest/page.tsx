"use client";

import { useState, useEffect, useMemo } from "react";
import { Gift, Loader2, AlertCircle, Download, Search } from "lucide-react";
import { SortIcon } from "@/components/admin/SortIcon";
import { exportToCsv } from "@/lib/exportCsv";

interface ReferralRow {
  id: string;
  investor_name: string;
  investor_id: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

type SortKey = "investor_name" | "email" | "created_at";
type SortDir = "asc" | "desc";

export default function ReferralInterestPage() {
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetch("/api/admin/referral-interest")
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setRows(d.data ?? []))
      .catch(() => setError("Failed to load referral interest data."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.investor_name.toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q) ||
      (r.phone ?? "").includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleExport = () => {
    exportToCsv(
      `referral-interest-${Date.now()}.csv`,
      sorted.map(r => ({
        investor_name: r.investor_name,
        investor_id: r.investor_id ? `INV-${r.investor_id.split("-")[0].toUpperCase().slice(0, 6)}` : "",
        email: r.email ?? "",
        phone: r.phone ?? "",
        signed_up: new Date(r.created_at).toLocaleString("en-IN"),
      })),
      [
        { key: "investor_name", label: "Investor Name" },
        { key: "investor_id",   label: "Investor ID" },
        { key: "email",         label: "Email" },
        { key: "phone",         label: "Phone" },
        { key: "signed_up",     label: "Signed Up" },
      ]
    );
  };

  const thisMonth = rows.filter(r => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-6 h-6 text-[#05CE78]" /> Referral Early Access
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {rows.length} investor{rows.length !== 1 ? "s" : ""} signed up for early access
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={rows.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Sign-ups</p>
          <p className="text-2xl font-black text-gray-900">{rows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">This Month</p>
          <p className="text-2xl font-black text-gray-900">{thisMonth}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Showing</p>
          <p className="text-2xl font-black text-gray-900">{filtered.length}</p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#05CE78]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-20 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            {search ? "No results match your search." : "No investors have signed up yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3">
                    <button onClick={() => handleSort("investor_name")} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-900 cursor-pointer">
                      Investor <SortIcon column="investor_name" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-6 py-3">
                    <button onClick={() => handleSort("email")} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-900 cursor-pointer">
                      Email <SortIcon column="email" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-6 py-3">
                    <button onClick={() => handleSort("created_at")} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-900 cursor-pointer">
                      Signed Up <SortIcon column="created_at" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{row.investor_name}</p>
                      {row.investor_id && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          INV-{row.investor_id.split("-")[0].toUpperCase().slice(0, 6)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{row.email ?? <span className="text-gray-300">-</span>}</td>
                    <td className="px-6 py-4 text-gray-600">{row.phone ?? <span className="text-gray-300">-</span>}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
