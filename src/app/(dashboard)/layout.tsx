"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getNextPayoutDetails, getPayoutDelayBanner } from "@/lib/payoutUtils";
import HelpButton from "@/components/HelpButton";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Loader2,
  ChevronDown,
  TrendingUp,
  CalendarClock,
  AlertTriangle,
  Sparkles,
  MessageCircle,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "payout" | "upcoming";
  timestamp: number;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [bannerExpectedBy, setBannerExpectedBy] = useState("");
  const [bannerCycleKey, setBannerCycleKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [investorName, setInvestorName] = useState("Valued Investor");
  const [investorInitials, setInvestorInitials] = useState("VI");
  const [investorId, setInvestorId] = useState("INV-....");
  const [investorEmail, setInvestorEmail] = useState("");
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    if (bannerCycleKey) localStorage.setItem(`hv_payout_banner_${bannerCycleKey}`, "true");
  };

  // ── Data fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const getData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/login"); return; }

        localStorage.setItem("hustlers_investor_verified", "true");
        if (user.email) setInvestorEmail(user.email);

        // A login can map to more than one investor profile (e.g. a shared family/associate
        // login) — fetch all matches rather than .single(), which errors on >1 row.
        const { data: investorRows } = await supabase
          .from("investors")
          .select("investor_name, investor_id, requires_password_change")
          .eq("user_id", user.id);

        const investorList = investorRows ?? [];

        if (investorList.length > 0) {
          const combinedName = investorList.map(i => i.investor_name.trim()).join(" & ");
          setInvestorName(combinedName);
          const initials = investorList.length > 1
            ? investorList.map(i => i.investor_name.trim()[0]).join("").substring(0, 2).toUpperCase()
            : investorList[0].investor_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
          setInvestorInitials(initials);
          setInvestorId(investorList.map(i => `INV-${i.investor_id.split("-")[0].toUpperCase().slice(0, 6)}`).join(" / "));
          setRequiresPasswordChange(investorList.some(i => i.requires_password_change) || false);

          const { data: investments } = await supabase
            .from("investor_investments")
            .select("investment_id, company_name, company_pools(pool_name)")
            .eq("user_id", user.id);

          if (investments && investments.length > 0) {
            const investmentIds = investments.map(i => i.investment_id);
            const { data: payouts } = await supabase
              .from("investor_quarterly_payments")
              .select("payment_id, net_payable_amount, payment_date, investment_id")
              .in("investment_id", investmentIds)
              .order("payment_date", { ascending: false })
              .limit(5);

            const latestPaymentDate = payouts?.[0]?.payment_date ?? null;
            const bannerInfo = getPayoutDelayBanner(latestPaymentDate);
            const bannerManuallyDismissed = localStorage.getItem(`hv_payout_banner_${bannerInfo.cycleKey}`) === "true";
            if (bannerInfo.show && !bannerManuallyDismissed) {
              setBannerExpectedBy(bannerInfo.expectedByLabel);
              setBannerCycleKey(bannerInfo.cycleKey);
              setBannerDismissed(false);
            }

            if (payouts && payouts.length > 0) {
              const payoutNotifs: NotificationItem[] = payouts.map(pay => {
                const asset = investments.find(inv => inv.investment_id === pay.investment_id);
                const assetName = asset?.company_name || (asset?.company_pools as any)?.[0]?.pool_name || "Asset";
                const amount = Number(pay.net_payable_amount).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
                const dateObj = new Date(pay.payment_date);
                return {
                  id: pay.payment_id,
                  title: "Payout Received",
                  message: `Received ${amount} from ${assetName}`,
                  time: dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                  type: "payout",
                  timestamp: dateObj.getTime(),
                };
              });
              setNotifications(payoutNotifs);
              fetch("/api/notifications/unread-count")
                .then(r => r.ok ? r.json() : { count: 0 })
                .then(({ count }) => setUnreadCount(count))
                .catch(() => {});
            } else {
              const nextPayout = getNextPayoutDetails();
              setNotifications([{
                id: "next-payout",
                title: "Upcoming Payout",
                message: `Next disbursement cycle is scheduled for ${nextPayout.label}.`,
                time: "Upcoming",
                type: "upcoming",
                timestamp: Date.now(),
              }]);
              setUnreadCount(0);
            }
          }
        } else {
          setInvestorInitials(user.email?.substring(0, 2).toUpperCase() || "HV");
        }
      } catch {
        // silent — layout recovers
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [router]);

  // ── Auth listener ───────────────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login?reason=session_expired");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // ── Password change trap ────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && requiresPasswordChange && pathname !== "/dashboard/settings") {
      router.replace("/dashboard/settings?alert=update_password");
    }
  }, [loading, pathname, requiresPasswordChange, router]);

  // ── Session timeout (30 min) ────────────────────────────────────────────────
  useEffect(() => {
    const TIMEOUT_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        const wasImpersonating = sessionStorage.getItem("hv_impersonating");
        sessionStorage.removeItem("hv_impersonating");
        router.replace(wasImpersonating ? "/admin/login" : "/login?reason=session_expired");
      }, TIMEOUT_MS);
    };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, resetTimer)); };
  }, [router]);

  // ── Close menus on route change ─────────────────────────────────────────────
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  // ── Click-outside + Escape ──────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) setNotificationsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setUserMenuOpen(false); setNotificationsOpen(false); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    const wasImpersonating = sessionStorage.getItem("hv_impersonating");
    sessionStorage.removeItem("hv_impersonating");
    router.replace(wasImpersonating ? "/admin/login" : "/login");
  };

  const handleMarkRead = () => {
    setUnreadCount(0);
    const items = notifications.map(n => ({ notification_type: n.type, notification_id: n.id }));
    if (items.length > 0) {
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }
  };

  // ── Nav Item ────────────────────────────────────────────────────────────────
  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
    const isDisabled = requiresPasswordChange && href !== "/dashboard/settings";

    return (
      <Link
        href={isDisabled ? "#" : href}
        title={isDisabled ? "Complete password setup to unlock navigation" : undefined}
        className={`
          relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold
          tracking-tight transition-all duration-150 group mb-0.5
          ${isDisabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}
          ${isActive
            ? "bg-[#05CE78] text-black shadow-[0_2px_12px_rgba(5,206,120,0.25)]"
            : "text-gray-400 hover:bg-white/6 hover:text-white"
          }
        `}
      >
        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-black" : "text-gray-500 group-hover:text-white"}`} />
        <span className="truncate">{label}</span>
        {isDisabled && <AlertTriangle className="w-3 h-3 ml-auto text-amber-500 shrink-0" />}
      </Link>
    );
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading || (requiresPasswordChange && pathname !== "/dashboard/settings")) {
    return (
      <div className="min-h-screen bg-gray-50 flex font-sans">
        {/* Skeleton sidebar */}
        <aside className="hidden md:flex flex-col w-[240px] bg-[#0B1120] border-r border-white/[0.06] shrink-0">
          <div className="h-[60px] flex items-center px-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse" />
              <div className="flex flex-col gap-1">
                <div className="w-20 h-2.5 bg-white/10 rounded animate-pulse" />
                <div className="w-12 h-1.5 bg-white/6 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex-1 px-3 py-5 space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        </aside>
        {/* Skeleton main */}
        <div className="flex-1 flex flex-col">
          <div className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
            <div className="w-32 h-4 bg-gray-100 rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
            </div>
          </div>
          <div className="flex-1 p-8 space-y-6">
            <div className="h-48 rounded-2xl bg-gray-200 animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-[240px]
        bg-[#0B1120] border-r border-white/[0.06]
        transform transition-transform duration-300 ease-out
        md:translate-x-0 md:static md:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 border-b border-white/[0.06] shrink-0">
          <Link
            href={requiresPasswordChange ? "#" : "/dashboard"}
            className="flex items-center gap-2 group min-w-0"
          >
            <div className="relative w-7 h-7 shrink-0 group-hover:scale-105 transition-transform">
              <Image src="/logo.svg" alt="Hustlers Ventures" fill sizes="28px" className="object-contain" />
            </div>
            <div className="flex flex-col leading-none gap-px min-w-0">
              <span className="text-[15px] font-extrabold tracking-tight text-white group-hover:text-[#05CE78] transition-colors truncate">
                HUSTLERS
              </span>
              <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">
                Ventures
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-0.5">

          {requiresPasswordChange && (
            <div className="mb-4 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300 leading-relaxed">
                Set a new password in <span className="font-bold">My Account</span> to unlock all features.
              </p>
            </div>
          )}

          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          {/* <NavItem href="/dashboard/insights" icon={Sparkles} label="Insights" /> — hidden from nav for now, page still live at /dashboard/insights */}
          <NavItem href="/dashboard/opportunities" icon={Globe} label="Opportunities" />
          <NavItem href="/dashboard/documents" icon={FileText} label="Documents" />
          <NavItem href="/dashboard/support" icon={MessageCircle} label="Support" />

          <div className="pt-5 mt-5 border-t border-white/[0.06]">
            <p className="px-3 text-xs font-bold text-white/25 uppercase tracking-[0.2em] mb-2.5">
              Account
            </p>
            <NavItem href="/dashboard/settings" icon={Settings} label="My Account" />
          </div>
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/[0.06] shrink-0">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-3 text-[13px] font-semibold text-gray-500 hover:text-red-400
                       transition-colors w-full px-3 py-2.5 rounded-xl hover:bg-red-500/8 group disabled:opacity-50"
          >
            {isSigningOut
              ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              : <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            }
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">

          {/* Left: hamburger + title */}
          <div className="flex items-center gap-3">
            <button
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 tracking-tight">Investor Portal</span>
              <span className="w-1 h-1 rounded-full bg-[#05CE78] animate-pulse" />
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
                disabled={requiresPasswordChange}
                onClick={() => { setNotificationsOpen(!notificationsOpen); if (!notificationsOpen) handleMarkRead(); }}
                className={`
                  relative p-2 rounded-lg transition-colors
                  ${requiresPasswordChange ? "opacity-40 cursor-not-allowed" : ""}
                  ${notificationsOpen ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}
                `}
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && !requiresPasswordChange && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                )}
              </button>

              {notificationsOpen && !requiresPasswordChange && (
                <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl z-50
                                border border-gray-100 overflow-hidden
                                shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)]
                                animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-sm">Recent Activity</h3>
                    <span className="text-xs text-gray-400 font-medium">Last 5 payouts</span>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-xs">No new notifications</div>
                    ) : (
                      notifications.map((notify) => (
                        <div key={notify.id} className="px-4 py-3.5 hover:bg-gray-50/80 transition-colors flex gap-3">
                          <div className="shrink-0 pt-0.5">
                            {notify.type === "payout"
                              ? <div className="w-8 h-8 bg-[#05CE78]/10 text-[#05CE78] rounded-lg flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
                              : <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center"><CalendarClock className="w-4 h-4" /></div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">{notify.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notify.message}</p>
                            <p className="text-xs text-gray-400 mt-1.5 font-medium">{notify.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-gray-100 p-2">
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="block text-xs text-gray-500 hover:text-gray-900 font-semibold py-2 px-3 w-full hover:bg-gray-50 rounded-lg transition-colors text-center"
                    >
                      View All Activity
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                aria-label="User account menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 hover:bg-gray-50 p-1.5 pr-2 rounded-xl transition-colors
                           outline-none focus-visible:ring-2 focus-visible:ring-[#05CE78]/30"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-bold text-gray-900 max-w-[130px] truncate leading-none mb-0.5" title={investorName}>
                    {investorName}
                  </p>
                  <p className="text-xs text-gray-400 font-mono tracking-wide leading-none">{investorId}</p>
                </div>
                <div className="w-9 h-9 bg-[#05CE78]/15 rounded-full border-2 border-[#05CE78]/30
                                flex items-center justify-center text-[#05CE78] font-black text-xs shrink-0">
                  {investorInitials}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 hidden sm:block ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-[260px] bg-white rounded-2xl z-50
                                border border-gray-100 overflow-hidden
                                shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)]
                                animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                  <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/60">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 leading-snug break-words">{investorName}</p>
                    {investorEmail && <p className="text-xs text-gray-500 mt-0.5 truncate">{investorEmail}</p>}
                    <p className="text-xs text-gray-400 font-mono mt-1">{investorId}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold
                                 text-gray-700 hover:bg-gray-50 hover:text-[#05CE78] rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 shrink-0" /> My Account
                    </Link>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold
                                 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ── PAYOUT DELAY BANNER ────────────────────────────────────────────── */}
        {!bannerDismissed && bannerExpectedBy && (
          <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <CalendarClock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-800 font-medium leading-snug">
                <span className="font-bold">Your payout is on its way</span> — disbursement expected on or before{" "}
                <span className="font-bold">{bannerExpectedBy}</span>. Thank you for your patience.
              </p>
            </div>
            <button
              onClick={handleDismissBanner}
              aria-label="Dismiss banner"
              className="shrink-0 p-1 text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── PAGE CONTENT ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth bg-gray-50">
          {children}
        </main>

      </div>

      <HelpButton investorName={investorName} investorEmail={investorEmail} />
    </div>
  );
}
