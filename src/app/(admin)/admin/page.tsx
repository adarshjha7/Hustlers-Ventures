import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatCurrency } from "@/lib/formatters";
import {
  Users, TrendingUp, Wallet, IndianRupee, Info,
  Lightbulb, UserPlus,
} from "lucide-react";
import AdminCharts, { type MonthlyPayoutPoint, type PoolCapitalPoint, type InvestorGrowthPoint } from "./AdminCharts";

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

const PERIODS = [
  { label: "All Time",     value: "all" },
  { label: "This Year",    value: "year" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Month",   value: "month" },
] as const;

type Period = typeof PERIODS[number]["value"];

const PERIOD_LABELS: Record<Period, string> = {
  all:     "Total Disbursed",
  year:    "Disbursed This Year",
  quarter: "Disbursed This Quarter",
  month:   "Disbursed This Month",
};

function getPeriodRange(period: Period): { start: string; end: string } | null {
  const now = new Date();
  if (period === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), end: now.toISOString() };
  }
  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return { start: new Date(now.getFullYear(), q * 3, 1).toISOString(), end: now.toISOString() };
  }
  if (period === "year") {
    return { start: new Date(now.getFullYear(), 0, 1).toISOString(), end: now.toISOString() };
  }
  return null;
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod = "all" } = await searchParams;
  const period = (PERIODS.map(p => p.value) as string[]).includes(rawPeriod)
    ? (rawPeriod as Period)
    : "all";

  const range = getPeriodRange(period);
  // Base payout query builder
  const payoutQuery = () =>
    supabaseAdmin
      .from("investor_quarterly_payments")
      .select("net_payable_amount, emergency_fund_deduction")
      .not("payment_date", "is", null);

  const recentPayoutQuery = () =>
    supabaseAdmin
      .from("investor_quarterly_payments")
      .select("payment_id, net_payable_amount, payment_date, investment_id, investor_investments ( user_id, investors ( investor_name ) )")
      .not("payment_date", "is", null)
      .order("payment_date", { ascending: false })
      .limit(5);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [
    { data: investors },
    { data: investments },
    { data: payouts },
    { data: opportunities },
    { data: recentInvestors },
    { data: recentPayouts },
    { data: recentLogs },
    { data: allPayouts12m },
    { data: poolInvestments },
    { data: allInvestorDates },
  ] = await Promise.all([
    supabaseAdmin.from("investors").select("investor_id, is_active, requires_password_change"),
    supabaseAdmin.from("investor_investments").select("investment_id, total_amount"),
    range
      ? payoutQuery().gte("payment_date", range.start).lte("payment_date", range.end)
      : payoutQuery(),
    supabaseAdmin.from("opportunities").select("id").eq("status", "active"),
    supabaseAdmin.from("investors").select("investor_id, investor_name, created_at, requires_password_change").order("created_at", { ascending: false }).limit(5),
    range
      ? recentPayoutQuery().gte("payment_date", range.start).lte("payment_date", range.end)
      : recentPayoutQuery(),
    supabaseAdmin.from("system_logs").select("id, level, message, created_at").order("created_at", { ascending: false }).limit(8),
    // Chart data
    supabaseAdmin.from("investor_quarterly_payments").select("net_payable_amount, payment_date").not("payment_date", "is", null).gte("payment_date", twelveMonthsAgo.toISOString()).order("payment_date", { ascending: true }),
    supabaseAdmin.from("investor_investments").select("total_amount, company_pools(pool_name)").gt("total_amount", 0),
    supabaseAdmin.from("investors").select("created_at").order("created_at", { ascending: true }),
  ]);

  const totalInvestors   = investors?.length ?? 0;
  const activeInvestors  = investors?.filter(i => i.is_active !== false && !i.requires_password_change).length ?? 0;
  const pendingInvestors = investors?.filter(i => i.requires_password_change && i.is_active !== false).length ?? 0;
  const deployedCapital  = investments?.reduce((s, i) => s + Number(i.total_amount ?? 0), 0) ?? 0;
  const totalDisbursed      = payouts?.reduce((s, p) => s + Number(p.net_payable_amount ?? 0), 0) ?? 0;
  const totalEmergencyFund  = payouts?.reduce((s, p) => s + Number((p as any).emergency_fund_deduction ?? 0), 0) ?? 0;
  const activeOpps          = opportunities?.length ?? 0;

  const stats = [
    {
      label: "Total Investors", value: String(totalInvestors), href: "/admin/investors",
      icon: Users, accent: "border-t-[#05CE78]", iconColor: "text-[#05CE78]", iconBg: "bg-[#05CE78]/10", valueColor: "text-[#05CE78]",
      sub: [
        { label: "Active",  value: activeInvestors,  color: "text-green-700 bg-green-50 border-green-100" },
        { label: "Pending", value: pendingInvestors, color: "text-orange-600 bg-orange-50 border-orange-100" },
      ],
    },
    {
      label: "Deployed Capital", value: formatCurrency(deployedCapital), href: "/admin/investments",
      icon: Wallet, accent: "border-t-blue-500", iconColor: "text-blue-500", iconBg: "bg-blue-50", valueColor: "text-blue-600",
      sub: [{ label: `${investments?.length ?? 0} investments`, value: null, color: "text-gray-500 bg-gray-50 border-gray-200" }],
    },
    {
      label: PERIOD_LABELS[period], value: formatCurrency(totalDisbursed), href: "/admin/payouts",
      icon: IndianRupee, accent: "border-t-amber-500", iconColor: "text-amber-500", iconBg: "bg-amber-50", valueColor: "text-amber-600",
      sub: [
        { label: `${payouts?.length ?? 0} payouts`, value: null, color: "text-gray-500 bg-gray-50 border-gray-200" },
        ...(totalEmergencyFund > 0 ? [{ label: `EF: ${formatCurrency(totalEmergencyFund)}`, value: null, color: "text-orange-600 bg-orange-50 border-orange-100" }] : []),
      ],
    },
    {
      label: "Active Opportunities", value: String(activeOpps), href: "/admin/opportunities",
      icon: Lightbulb, accent: "border-t-emerald-400", iconColor: "text-emerald-500", iconBg: "bg-emerald-50", valueColor: "text-emerald-600",
      sub: [],
    },
  ];

  // ── Chart data aggregation ──────────────────────────────────────────────────

  // Monthly payouts: group by "Mon YY"
  const monthlyPayoutMap: Record<string, number> = {};
  for (const p of allPayouts12m ?? []) {
    const key = new Date(p.payment_date!).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    monthlyPayoutMap[key] = (monthlyPayoutMap[key] ?? 0) + Number(p.net_payable_amount ?? 0);
  }
  const monthlyPayouts: MonthlyPayoutPoint[] = Object.entries(monthlyPayoutMap).map(([month, total]) => ({ month, total }));

  // Pool capital: sum by pool name, sorted descending, top 8
  const poolMap: Record<string, number> = {};
  for (const inv of poolInvestments ?? []) {
    const name = (inv.company_pools as any)?.pool_name ?? "Other";
    poolMap[name] = (poolMap[name] ?? 0) + Number(inv.total_amount ?? 0);
  }
  const poolCapital: PoolCapitalPoint[] = Object.entries(poolMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([pool, total]) => ({ pool, total }));

  // Investor growth: cumulative count by month
  const growthMap: Record<string, number> = {};
  for (const inv of allInvestorDates ?? []) {
    const key = new Date(inv.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    growthMap[key] = (growthMap[key] ?? 0) + 1;
  }
  let cum = 0;
  const investorGrowth: InvestorGrowthPoint[] = Object.entries(growthMap).map(([month, n]) => {
    cum += n;
    return { month, count: cum };
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Platform summary at a glance.</p>
        </div>
        {/* Period filter */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODS.map(p => (
            <Link
              key={p.value}
              href={p.value === "all" ? "/admin" : `/admin?period=${p.value}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p.value
                  ? "bg-[#0B1120] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`bg-white rounded-2xl border border-gray-100 border-t-4 ${stat.accent} p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 group`}
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] leading-none">{stat.label}</p>
              <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-black tabular-nums tracking-tight leading-none ${stat.valueColor}`}>{stat.value}</p>
            {stat.sub.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {stat.sub.map((s, i) => (
                  <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${s.color}`}>
                    {s.value != null ? `${s.label}: ${s.value}` : s.label}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Analytics charts */}
      <AdminCharts
        monthlyPayouts={monthlyPayouts}
        poolCapital={poolCapital}
        investorGrowth={investorGrowth}
      />

      {/* Recent activity — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-[#05CE78]" /> Recent Registrations
            </h2>
            <Link href="/admin/investors" className="text-xs text-[#05CE78] font-bold hover:text-[#04b86c] transition-colors">
              View all
            </Link>
          </div>
          {!recentInvestors?.length ? (
            <p className="text-sm text-gray-400 text-center py-10">No investors yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentInvestors.map(inv => (
                <li key={inv.investor_id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#05CE78]/10 border border-[#05CE78]/15 flex items-center justify-center text-xs font-black text-[#05CE78] shrink-0">
                      {inv.investor_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{inv.investor_name}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        {new Date(inv.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  {inv.requires_password_change && (
                    <span className="shrink-0 text-xs font-bold px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-md ml-2">
                      Pending
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Payouts */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              {period === "all" ? "Recent Payouts" : `Payouts · ${PERIODS.find(p => p.value === period)?.label}`}
            </h2>
            <Link href="/admin/payouts" className="text-xs text-[#05CE78] font-bold hover:text-[#04b86c] transition-colors">
              View all
            </Link>
          </div>
          {!recentPayouts?.length ? (
            <p className="text-sm text-gray-400 text-center py-10">No payouts{period !== "all" ? " in this period" : " recorded yet"}.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentPayouts.map((p: any) => {
                const investorName = p.investor_investments?.investors?.investor_name ?? "-";
                return (
                  <li key={p.payment_id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{investorName}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        {new Date(p.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className="font-black text-emerald-600 tabular-nums text-sm shrink-0 ml-3">{formatCurrency(p.net_payable_amount)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* System logs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-gray-400" /> System Logs
          </h2>
          <Link href="/admin/logs" className="text-xs text-[#05CE78] font-bold hover:text-[#04b86c] transition-colors">View all</Link>
        </div>
        {!recentLogs?.length ? (
          <p className="text-sm text-gray-400 text-center py-10">No activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentLogs.map(log => (
              <li key={log.id} className="px-5 py-2.5 flex items-start gap-3 hover:bg-gray-50/70 transition-colors">
                <span className={`mt-0.5 shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap ${LEVEL_STYLES[log.level] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                  <span className={`w-1 h-1 rounded-full ${LEVEL_DOT[log.level] ?? "bg-gray-400"}`} />
                  {log.level}
                </span>
                <p className="flex-1 text-xs text-gray-700 leading-relaxed">{log.message}</p>
                <p className="text-xs text-gray-400 whitespace-nowrap font-mono shrink-0 pt-0.5">
                  {new Date(log.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}{" "}
                  {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
