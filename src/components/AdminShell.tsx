"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import AdminGlobalSearch from "@/components/AdminGlobalSearch";
import SessionTimeout from "@/components/SessionTimeout";
import LoginAsInvestorButton from "@/components/LoginAsInvestorButton";

// The Support page's three-panel layout (inbox + thread + investor context) is cramped with the
// full sidebar open, so it starts collapsed there; every other admin page starts expanded as before.
const COLLAPSED_BY_DEFAULT_PREFIXES = ["/admin/support"];

export default function AdminShell({ userEmail, children }: { userEmail: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => !COLLAPSED_BY_DEFAULT_PREFIXES.some(p => pathname.startsWith(p))
  );

  return (
    <div className="h-screen flex bg-gray-50 font-sans overflow-hidden">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside
        className={`bg-[#0B1120] flex flex-col shrink-0 h-screen sticky top-0 overflow-hidden transition-[width] duration-200 ${
          sidebarOpen ? "w-[240px]" : "w-0"
        }`}
      >
        <div className="w-[240px] flex flex-col h-full">
          {/* Logo */}
          <div className="h-[60px] flex items-center px-5 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#05CE78] rounded-lg flex items-center justify-center text-black font-black text-sm shrink-0">
                HV
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-extrabold tracking-tight text-white leading-none">HUSTLERS</span>
                <span className="text-[9px] font-bold tracking-[0.22em] text-white/35 uppercase mt-0.5">Ventures</span>
              </div>
            </div>
          </div>

          <AdminNav />

          {/* Footer — impersonate, email + sign out */}
          <div className="px-3 py-4 border-t border-white/[0.06] shrink-0">
            <LoginAsInvestorButton />
            <div className="px-3 py-2 mb-1 mt-1">
              <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest mb-0.5">Signed in as</p>
              <p className="text-xs text-gray-400 font-medium truncate">{userEmail}</p>
            </div>
            <AdminSignOutButton />
          </div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">

        {/* Header */}
        <div className="sticky top-0 z-30 h-[60px] bg-white border-b border-gray-200 px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <p className="text-sm font-bold text-gray-800 tracking-tight truncate">Admin Console</p>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#05CE78]/10 border border-[#05CE78]/20 text-[#05CE78] text-[10px] font-bold tracking-wider uppercase shrink-0">
              <span className="w-1 h-1 rounded-full bg-[#05CE78] animate-pulse" />
              Live
            </span>
          </div>
          <AdminGlobalSearch />
        </div>

        {children}
      </main>

      <SessionTimeout timeoutMs={30 * 60 * 1000} redirectTo="/admin/login?reason=session_expired" />
    </div>
  );
}
