"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { logEvent } from "@/lib/logger";
import {
  Bell,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Activity,
  Megaphone,
  MessageCircle,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "payout" | "alert" | "broadcast" | "support";
  title: string;
  message: string;
  dateStr: string;
  rawDate: Date;
  isRead: boolean;
  amount?: string;
  link?: string;
}

type FilterType = "all" | "payout" | "alert" | "broadcast" | "support";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    async function fetchData() {
      let currentUserId: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        currentUserId = user.id;

        const allItems: NotificationItem[] = [];

        // Fetch investments, broadcasts+readIds in parallel
        const [investmentsResult, notifRes] = await Promise.all([
          supabase
            .from("investor_investments")
            .select("investment_id, company_name, company_pools(pool_name)")
            .eq("user_id", user.id),
          fetch("/api/notifications"),
        ]);

        // Parse broadcasts + support messages + readIds from API
        let readSet = new Set<string>();
        let broadcasts: any[] = [];
        let supportMessages: any[] = [];
        if (notifRes.ok) {
          const data = await notifRes.json();
          broadcasts = data.broadcasts ?? [];
          supportMessages = data.supportMessages ?? [];
          readSet = new Set<string>(data.readIds ?? []);
        }

        // Payouts
        const investments = investmentsResult.data ?? [];
        let unreadItems: { notification_type: string; notification_id: string }[] = [];

        if (investments.length > 0) {
          const investmentIds = investments.map((i) => i.investment_id);
          const { data: payouts } = await supabase
            .from("investor_quarterly_payments")
            .select("payment_id, net_payable_amount, payment_date, investment_id")
            .in("investment_id", investmentIds)
            .order("payment_date", { ascending: false });

          (payouts ?? []).forEach((pay) => {
            const asset = investments.find((inv) => inv.investment_id === pay.investment_id);
            const assetName =
              (asset as any)?.company_name ||
              (asset as any)?.company_pools?.[0]?.pool_name ||
              "Asset";
            const amount = Number(pay.net_payable_amount).toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            });
            const isRead = readSet.has(`payout:${pay.payment_id}`);
            allItems.push({
              id: pay.payment_id,
              type: "payout",
              title: "Payout Received",
              message: `You received ${amount} from ${assetName}.`,
              amount,
              dateStr: new Date(pay.payment_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              rawDate: new Date(pay.payment_date),
              isRead,
              link: "/dashboard/portfolio",
            });
            if (!isRead) unreadItems.push({ notification_type: "payout", notification_id: pay.payment_id });
          });
        }

        // Broadcasts
        broadcasts.forEach((b: any) => {
          const preview =
            (b.body as string).length > 180
              ? b.body.slice(0, 180).trimEnd() + "…"
              : b.body;
          const isRead = readSet.has(`broadcast:${b.id}`);
          allItems.push({
            id: b.id,
            type: "broadcast",
            title: b.subject ?? "Announcement",
            message: preview,
            dateStr: new Date(b.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            rawDate: new Date(b.created_at),
            isRead,
          });
          if (!isRead) unreadItems.push({ notification_type: "broadcast", notification_id: b.id });
        });

        // Support replies
        supportMessages.forEach((m: any) => {
          const preview = (m.content as string) || "New message on your support request.";
          const isRead = readSet.has(`support:${m.id}`);
          allItems.push({
            id: m.id,
            type: "support",
            title: `Reply on ${m.ticket_ref || m.subject}`,
            message: preview.length > 180 ? preview.slice(0, 180).trimEnd() + "…" : preview,
            dateStr: new Date(m.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            rawDate: new Date(m.created_at),
            isRead,
            link: `/dashboard/support?thread=${m.thread_id}`,
          });
          if (!isRead) unreadItems.push({ notification_type: "support", notification_id: m.id });
        });

        allItems.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        setNotifications(allItems);

        // Mark all unread items as read (fire-and-forget)
        if (unreadItems.length > 0) {
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: unreadItems }),
          });
          // Optimistically mark as read in UI
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, isRead: true }))
          );
        }

        await logEvent("INFO", "User loaded notifications feed", {
          userId: currentUserId,
          notificationCount: allItems.length,
        });
      } catch (err: any) {
        console.error("Error fetching notifications:", err);
        await logEvent("ERROR", "Failed to load notifications feed", {
          userId: currentUserId,
          errorDetails: err.message || err,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "payout":    return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case "alert":     return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "broadcast": return <Megaphone className="w-5 h-5 text-[#05CE78]" />;
      case "support":   return <MessageCircle className="w-5 h-5 text-blue-600" />;
      default:          return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "payout":    return "bg-emerald-50 border-emerald-100";
      case "alert":     return "bg-amber-50 border-amber-100";
      case "broadcast": return "bg-[#05CE78]/10 border-[#05CE78]/20";
      case "support":   return "bg-blue-50 border-blue-100";
      default:          return "bg-gray-50 border-gray-100";
    }
  };

  const filteredList = notifications.filter((n) =>
    activeFilter === "all" ? true : n.type === activeFilter
  );
  const broadcastCount = notifications.filter((n) => n.type === "broadcast").length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="h-44 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-12">

      {/* DARK HEADER */}
      <div className="bg-[#0B1120] rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[900px] h-[500px] bg-[#05CE78]/10 blur-[120px] rounded-full" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          <div className="absolute w-[400px] h-[200px] bg-[#05CE78]/8 blur-[80px] rounded-full" style={{ top: "33%", left: "50%", transform: "translate(-50%, -50%)" }} />
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-white">
          <Activity className="w-64 h-64" />
        </div>

        <div className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#05CE78] bg-[#05CE78]/10 px-2 py-0.5 rounded border border-[#05CE78]/20">
                  <div className="w-1.5 h-1.5 bg-[#05CE78] rounded-full animate-pulse" /> Live Updates
                </span>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-extrabold text-white">Activity Feed</h2>
              <p className="text-gray-400 mt-2 text-sm max-w-lg">
                Stay updated with your latest payouts, investment alerts, and announcements.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-8 border-t border-white/10 pt-4 overflow-x-auto">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-[#05CE78] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setActiveFilter("payout")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeFilter === "payout"
                  ? "bg-[#05CE78] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <TrendingUp className="w-3 h-3" /> Payouts
            </button>
            <button
              onClick={() => setActiveFilter("broadcast")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeFilter === "broadcast"
                  ? "bg-[#05CE78] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Megaphone className="w-3 h-3" /> Announcements
              {broadcastCount > 0 && (
                <span
                  className={`text-xs font-black px-1.5 py-0.5 rounded-full ${
                    activeFilter === "broadcast"
                      ? "bg-white/20 text-white"
                      : "bg-[#05CE78]/20 text-[#05CE78]"
                  }`}
                >
                  {broadcastCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter("support")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeFilter === "support"
                  ? "bg-[#05CE78] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <MessageCircle className="w-3 h-3" /> Support
            </button>
            <button
              onClick={() => setActiveFilter("alert")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeFilter === "alert"
                  ? "bg-[#05CE78] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> Alerts
            </button>
          </div>
        </div>
      </div>

      {/* FEED LIST */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredList.length > 0 ? (
            filteredList.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`p-6 flex gap-4 transition-colors group relative ${
                  item.isRead ? "hover:bg-gray-50" : "bg-[#05CE78]/[0.03] hover:bg-[#05CE78]/[0.06]"
                }`}
              >
                {/* Unread dot */}
                {!item.isRead && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#05CE78] rounded-full" />
                )}

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${getBgColor(item.type)}`}
                >
                  {getIcon(item.type)}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <h3
                      className={`text-sm font-bold transition-colors group-hover:text-[#05CE78] ${
                        item.isRead ? "text-gray-900" : "text-gray-900"
                      }`}
                    >
                      {item.title}
                      {!item.isRead && (
                        <span className="ml-2 text-xs font-black text-[#05CE78] bg-[#05CE78]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          New
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3 h-3" /> {item.dateStr}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-1 leading-relaxed max-w-2xl whitespace-pre-line">
                    {item.message}
                  </p>

                  {item.link && (
                    <div className="mt-3">
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 group-hover:text-[#05CE78] transition-colors"
                      >
                        View Details
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold mb-1">No activity found</h3>
              <p className="text-gray-400 text-sm">
                We couldn&apos;t find any recent activity matching your filter.
              </p>
              {activeFilter !== "all" && (
                <button
                  onClick={() => setActiveFilter("all")}
                  className="mt-4 text-[#05CE78] text-xs font-bold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
