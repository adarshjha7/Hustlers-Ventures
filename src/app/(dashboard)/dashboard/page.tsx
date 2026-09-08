"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logEvent } from "@/lib/logger";
import { formatCurrency, formatCurrencyCompact, isTransportationAsset, getAssetSector, type AssetSector } from "@/lib/formatters";
import {
  ArrowUpRight, Download, AlertCircle,
  Loader2, Hourglass, TrendingUp,
  Banknote, CheckCircle, Sunrise, Sun, Moon,
  Bus, Building2, Activity, Utensils, Landmark,
  Eye, EyeOff, Coins, Calendar, X, Briefcase, FileText,
  Award, Sparkles, ShieldCheck, RefreshCw, Info,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";

import SetupNudge from "@/components/SetupNudge";
import SwitchToCagrCard from "@/components/SwitchToCagrCard";
import { getPayoutStatus, PayoutStatus } from "@/lib/payoutUtils";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const PALETTE = [
  "#05CE78", "#3B82F6", "#6366F1", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#10B981", "#06B6D4", "#F97316",
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Payout {
  investment_id: string;
  gross_roi_amount: number;
  net_payable_amount: number;
  emergency_fund: number;
  tds_amount: number;
  payment_date: string;
  months_considered: number;
  quarter: string;
  month_names: string | null;
}

interface Investment {
  investment_id: string;
  company_name: string | null;
  total_amount: number;
  agreement_url: string | null;
  created_at: string;
  return_type: "CAGR" | "XIRR";
  company_pools: { status: string; pool_name: string; opportunity_categories: { name: string; slug: string; volatility_level: string | null } | null } | null;
  metrics?: {
    totalInvested: number;
    totalPayouts: number;
    annualizedYield: number;
    absoluteRoi: number;
    payouts: Payout[];
    lastPayoutAmount: number;
    lastPayoutDate: string | null;
  };
}

interface ChartDataPoint {
  label: string;
  monthNames: string | null;
  fullDate: string;
  netValue: number;
  grossValue: number;
  emergencyValue: number;
  tdsValue: number;
  dateObj: Date;
  [key: string]: unknown;
}

interface YearlyYield { year: number; yieldPercent: number; totalPayout: number; }
interface InvestorProfile { name: string; id: string; }

// investorProfile.id may be a single investor_id, or multiple comma-joined ids when a login
// maps to more than one investor profile (e.g. a shared family/associate login).
const formatInvestorIdLabel = (id: string) =>
  id.split(",").map(part => `INV-${part.split("-")[0].toUpperCase()}`).join(" / ");
interface PerfMetrics { gross: number; emergency: number; tds: number; }
type TimeRange = "6M" | "1Y" | "3Y" | "ALL";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getGreeting(): { text: string; Icon: React.ElementType; color: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", Icon: Sunrise, color: "text-amber-400" };
  if (hour < 17) return { text: "Good Afternoon", Icon: Sun, color: "text-orange-400" };
  return { text: "Good Evening", Icon: Moon, color: "text-indigo-400" };
}

const getPerformanceYear = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
};

const BENCHMARKS: Record<"fd" | "nifty", Record<number, number>> = {
  fd:    { 2022: 5.5, 2023: 6.8, 2024: 6.8, 2025: 6.5, 2026: 6.25 },
  nifty: { 2022: -4.3, 2023: 20.0, 2024: 8.8, 2025: 5.2 },
};
const BENCHMARK_META: Record<"fd" | "nifty", { label: string; color: string }> = {
  fd:    { label: "FD Rate",  color: "#94A3B8" },
  nifty: { label: "Nifty 50", color: "#6366F1" },
};

interface MilestoneBadge { label: string; color: string; }

function getMilestones(
  investments: Investment[],
  totalInvested: number,
  totalLifetimeReturns: number,
): MilestoneBadge[] {
  if (investments.length === 0) return [];
  const badges: MilestoneBadge[] = [];

  const oldestMs = Math.min(...investments.map(i => new Date(i.created_at).getTime()));
  const yearsInvested = (Date.now() - oldestMs) / (1000 * 60 * 60 * 24 * 365.25);

  if (yearsInvested >= 2) badges.push({ label: `${Math.floor(yearsInvested)}-Year Investor`, color: "blue" });
  else if (yearsInvested >= 1) badges.push({ label: "1-Year Investor", color: "blue" });
  else badges.push({ label: "New Investor", color: "emerald" });

  if (totalInvested >= 5000000) badges.push({ label: "₹50L+ Deployed", color: "violet" });
  else if (totalInvested >= 1000000) badges.push({ label: "₹10L+ Deployed", color: "violet" });

  const allPayouts = investments.flatMap(i => i.metrics?.payouts || []);
  if (allPayouts.length >= 10) badges.push({ label: "10 Payouts", color: "teal" });
  else if (allPayouts.length >= 5) badges.push({ label: "5 Payouts", color: "teal" });
  else if (allPayouts.length >= 1) badges.push({ label: "First Payout", color: "amber" });

  if (totalLifetimeReturns >= 1000000) badges.push({ label: "₹10L+ Earned", color: "green" });
  else if (totalLifetimeReturns >= 100000) badges.push({ label: "₹1L+ Earned", color: "green" });

  return badges;
}

function buildChartData(investments: Investment[]): ChartDataPoint[] {
  const groupedMap = new Map<string, ChartDataPoint>();

  investments.forEach((inv, invIndex) => {
    const payouts = inv.metrics?.payouts || [];
    const netKey = `inv_${invIndex}_net`;
    const grossKey = `inv_${invIndex}_gross`;

    payouts.forEach(p => {
      const key =
        p.quarter && p.quarter !== "Distribution"
          ? p.quarter
          : new Date(p.payment_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const existing = groupedMap.get(key);
      if (existing) {
        existing.netValue += p.net_payable_amount;
        existing.grossValue += p.gross_roi_amount;
        existing.emergencyValue += p.emergency_fund;
        existing.tdsValue += p.tds_amount;
        existing[netKey] = ((existing[netKey] as number) || 0) + p.net_payable_amount;
        existing[grossKey] = ((existing[grossKey] as number) || 0) + p.gross_roi_amount;
      } else {
        const dateObj = new Date(p.payment_date);
        groupedMap.set(key, {
          label: key,
          monthNames: p.month_names,
          netValue: p.net_payable_amount,
          grossValue: p.gross_roi_amount,
          emergencyValue: p.emergency_fund,
          tdsValue: p.tds_amount,
          dateObj,
          fullDate: dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          [netKey]: p.net_payable_amount,
          [grossKey]: p.gross_roi_amount,
        });
      }
    });
  });

  return Array.from(groupedMap.values()).sort((a, b) => {
    const parseQuarter = (label: string) => {
      if (label.match(/^Q[1-4]-\d{4}$/)) {
        const [q, y] = label.split("-");
        return { year: parseInt(y, 10), qNum: parseInt(q.replace("Q", ""), 10) };
      }
      return null;
    };
    const qA = parseQuarter(a.label);
    const qB = parseQuarter(b.label);
    if (qA && qB) {
      if (qA.year !== qB.year) return qA.year - qB.year;
      return qA.qNum - qB.qNum;
    }
    return a.dateObj.getTime() - b.dateObj.getTime();
  });
}

// ─── CAPITAL TIMELINE ─────────────────────────────────────────────────────────

interface CapitalTx {
  investment_id: string;
  investment_amount: number;
  transaction_type: string;
  created_at: string;
  pool_name?: string;
}

interface CapitalTimelinePoint {
  idx: number;         // unique array index — used as XAxis dataKey
  label: string;       // "31 Oct 25"
  cumulative: number;  // running total at this point
  delta: number;       // amount added/removed in this event
  pool_name: string;
  type: "add" | "withdrawal";
  date: string;        // full ISO for tooltip
}

function buildCapitalTimelineData(txns: CapitalTx[]): CapitalTimelinePoint[] {
  if (txns.length === 0) return [];

  const sorted = [...txns].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let cumulative = 0;
  const points: CapitalTimelinePoint[] = sorted.map((tx, i) => {
    const delta = Number(tx.investment_amount);
    cumulative = tx.transaction_type === "add" ? cumulative + delta : cumulative - delta;
    const d = new Date(tx.created_at);
    return {
      idx: i,
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }),
      cumulative,
      delta,
      pool_name: tx.pool_name ?? "Investment",
      type: tx.transaction_type as "add" | "withdrawal",
      date: tx.created_at,
    };
  });

  // Extend x-axis to today so all points are visible and not bunched at the right edge
  const today = new Date();
  const lastDate = new Date(sorted[sorted.length - 1].created_at);
  // Only add if last transaction isn't already today
  if (lastDate.toDateString() !== today.toDateString()) {
    points.push({
      idx: points.length,
      label: "Today",
      cumulative,
      delta: 0,
      pool_name: "",
      type: "add",
      date: today.toISOString(),
    });
  }

  return points;
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────

const generatePortfolioPDF = (
  investments: Investment[],
  totalInvested: number,
  totalLifetimeReturns: number,
  investorProfile: InvestorProfile | null,
  perfMetrics: PerfMetrics,
  lastPayoutAmount: number,
  lastPayoutDateStr: string | null,
  payoutStatus: PayoutStatus,
  lastYearYield: number
) => {
  const doc = new jsPDF();

  const safeFormatIN = (val: number) => {
    const numStr = Math.round(val).toString();
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    return (otherNumbers !== "" ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "") + lastThree;
  };
  const fmt = (val: number) => `Rs. ${safeFormatIN(val)}`;
  const compact = (val: number) => safeFormatIN(val);

  doc.setFontSize(24); doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30); doc.text("HUSTLERS", 14, 22);
  doc.setTextColor(5, 206, 120); doc.text("VENTURES", 14, 30);
  doc.setFontSize(18); doc.setTextColor(30, 30, 30);
  doc.text("Investment Portfolio Report", 196, 22, { align: "right" });
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
  doc.text(`Report Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}`, 196, 30, { align: "right" });
  doc.setDrawColor(230, 230, 230); doc.line(14, 38, 196, 38);

  let currentY = 46;

  autoTable(doc, {
    startY: currentY,
    head: [["Client Information", ""]],
    body: [
      ["Name", investorProfile?.name || "N/A"],
      ["Investor ID", investorProfile?.id ? formatInvestorIdLabel(investorProfile.id) : "N/A"],
    ],
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255, fontSize: 11 },
    styles: { fontSize: 10, cellPadding: 5, textColor: [40, 40, 40] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    head: [["Portfolio Summary", ""]],
    body: [
      ["Total Investment", fmt(totalInvested)],
      ["Total Payouts", fmt(totalLifetimeReturns)],
      ["Last Payout", `Rs. ${compact(lastPayoutAmount)} (${lastPayoutDateStr || "N/A"})`],
      ["Next Payout", payoutStatus.displayDate],
      ["Blended IRR", `${lastYearYield.toFixed(1)}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255, fontSize: 11 },
    styles: { fontSize: 10, cellPadding: 5, textColor: [40, 40, 40] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    head: [["Asset Name", "Status", "Invested Amount", "Investment Date"]],
    body: investments.map(a => [
      a.company_name || a.company_pools?.pool_name || "N/A",
      a.company_pools?.status || "Active",
      fmt(Number(a.total_amount)),
      a.created_at ? new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A",
    ]),
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    head: [["Metric", "Amount"]],
    body: [
      ["Gross Revenue", fmt(perfMetrics.gross)],
      ["Emergency Fund", `- ${fmt(perfMetrics.emergency)}`],
      ["TDS", `- ${fmt(perfMetrics.tds)}`],
      ["Net Earnings", fmt(totalLifetimeReturns)],
      ["Annualised IRR", `${lastYearYield.toFixed(1)}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  doc.addPage(); currentY = 20;

  // Section title
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30);
  doc.text("Payout History - Per Asset", 14, currentY);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120);
  doc.text("Chronological breakdown per investment. Useful for tax computation (ITR / CA submission).", 14, currentY + 6);
  currentY += 14;

  // Build grouped body rows
  const groupedBody: import("jspdf-autotable").RowInput[] = [];
  let grandGross = 0, grandEmg = 0, grandTds = 0, grandNet = 0;

  investments.forEach(inv => {
    const assetPayouts = (inv.metrics?.payouts || [])
      .slice()
      .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
    if (assetPayouts.length === 0) return;

    const assetName = inv.company_name || inv.company_pools?.pool_name || "Asset";

    // Asset section header row
    groupedBody.push([
      { content: assetName, colSpan: 6, styles: { fontStyle: "bold" as const, fillColor: [240, 253, 248] as [number,number,number], textColor: [5, 100, 60] as [number,number,number] } },
    ]);

    let subGross = 0, subEmg = 0, subTds = 0, subNet = 0;

    assetPayouts.forEach(p => {
      subGross += p.gross_roi_amount; subEmg += p.emergency_fund;
      subTds += p.tds_amount; subNet += p.net_payable_amount;
      groupedBody.push([
        new Date(p.payment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        p.quarter && p.quarter !== "Distribution" ? p.quarter : "-",
        compact(p.gross_roi_amount),
        compact(p.emergency_fund),
        compact(p.tds_amount),
        compact(p.net_payable_amount),
      ]);
    });

    // Per-asset subtotal
    groupedBody.push([
      { content: "Subtotal", colSpan: 2, styles: { fontStyle: "bold" as const, fillColor: [248, 250, 252] as [number,number,number] } },
      { content: compact(subGross), styles: { fontStyle: "bold" as const, fillColor: [248, 250, 252] as [number,number,number] } },
      { content: compact(subEmg), styles: { fontStyle: "bold" as const, fillColor: [248, 250, 252] as [number,number,number] } },
      { content: compact(subTds), styles: { fontStyle: "bold" as const, fillColor: [248, 250, 252] as [number,number,number] } },
      { content: compact(subNet), styles: { fontStyle: "bold" as const, fillColor: [248, 250, 252] as [number,number,number] } },
    ]);

    grandGross += subGross; grandEmg += subEmg; grandTds += subTds; grandNet += subNet;
  });

  // Grand total row
  if (groupedBody.length > 0) {
    groupedBody.push([
      { content: "TOTAL", colSpan: 2, styles: { fontStyle: "bold" as const, fillColor: [5, 206, 120] as [number,number,number], textColor: [255, 255, 255] as [number,number,number] } },
      { content: compact(grandGross), styles: { fontStyle: "bold" as const, fillColor: [5, 206, 120] as [number,number,number], textColor: [255, 255, 255] as [number,number,number] } },
      { content: compact(grandEmg), styles: { fontStyle: "bold" as const, fillColor: [5, 206, 120] as [number,number,number], textColor: [255, 255, 255] as [number,number,number] } },
      { content: compact(grandTds), styles: { fontStyle: "bold" as const, fillColor: [5, 206, 120] as [number,number,number], textColor: [255, 255, 255] as [number,number,number] } },
      { content: compact(grandNet), styles: { fontStyle: "bold" as const, fillColor: [5, 206, 120] as [number,number,number], textColor: [255, 255, 255] as [number,number,number] } },
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [["Date", "Quarter", "Gross (Rs.)", "Emg. Fund", "TDS", "Net Payout"]],
    body: groupedBody.length > 0 ? groupedBody : [["No payouts recorded", "", "", "", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255, fontSize: 9, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
    showHead: "everyPage",
  });

  doc.save(`Investment-Portfolio-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
};


// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Auth state (stored separately so logEvent callbacks outside useEffect can access it)
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  // Data state
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [exitDateMap, setExitDateMap] = useState<Record<string, string>>({});
  const [perfMetrics, setPerfMetrics] = useState<PerfMetrics>({ gross: 0, emergency: 0, tds: 0 });
  const [yearlyYields, setYearlyYields] = useState<YearlyYield[]>([]);

  // Summary state
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalLifetimeReturns, setTotalLifetimeReturns] = useState(0);
  const [lastYearYield, setLastYearYield] = useState(0);
  const [prevYearYield, setPrevYearYield] = useState(0);
  const [lastPayoutAmount, setLastPayoutAmount] = useState(0);
  const [lastPayoutDateStr, setLastPayoutDateStr] = useState<string | null>(null);
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus>({
    status: "upcoming", label: "Loading...", displayDate: "...", dateObj: new Date(), daysLeft: 0, message: "",
  });

  // Capital timeline
  const [capitalTxns, setCapitalTxns] = useState<CapitalTx[]>([]);

  // Chart / table state
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const [showGross, setShowGross] = useState(false);
  const [chartTab, setChartTab] = useState<"trajectory" | "history" | "capital">("trajectory");
  const [benchmark, setBenchmark] = useState<"fd" | "nifty">("fd");
  const [sortBy, setSortBy] = useState<"invested" | "payouts" | "irr">("invested");
  const [portfolioPage, setPortfolioPage] = useState(1);
  const [expressInterestTarget, setExpressInterestTarget] = useState<string | null>(null);
  const [expressInterestSent, setExpressInterestSent] = useState(false);
  const PORTFOLIO_PAGE_SIZE = 6;

  // Opportunities
  const [dashOpportunities, setDashOpportunities] = useState<{
    id: string; title: string; tagline: string | null;
    min_investment: number | null; target_irr: number | null; tenure: string | null;
    status: string; brochure_url: string | null; detail_url: string | null;
    volatility_level: string | null; volatility_note: string | null;
    opportunity_categories: { name: string; slug: string } | null;
  }[]>([]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const allChartData = useMemo(() => buildChartData(investments), [investments]);
  const capitalTimelineData = useMemo(() => buildCapitalTimelineData(capitalTxns), [capitalTxns]);

  const filteredData = useMemo(() => {
    if (timeRange === "ALL") return allChartData;
    const cutoff = new Date();
    if (timeRange === "6M") cutoff.setMonth(cutoff.getMonth() - 6);
    if (timeRange === "1Y") cutoff.setFullYear(cutoff.getFullYear() - 1);
    if (timeRange === "3Y") cutoff.setFullYear(cutoff.getFullYear() - 3);
    return allChartData.filter(d => d.dateObj >= cutoff);
  }, [allChartData, timeRange]);

  const viewTotal = filteredData.reduce((acc, curr) => acc + (showGross ? curr.grossValue : curr.netValue), 0);

  const filteredPayoutCount = useMemo(() => {
    const all = investments.flatMap(i => i.metrics?.payouts || []);
    if (timeRange === "ALL") return all.length;
    const cutoff = new Date();
    if (timeRange === "6M") cutoff.setMonth(cutoff.getMonth() - 6);
    if (timeRange === "1Y") cutoff.setFullYear(cutoff.getFullYear() - 1);
    if (timeRange === "3Y") cutoff.setFullYear(cutoff.getFullYear() - 3);
    return all.filter(p => new Date(p.payment_date) >= cutoff).length;
  }, [investments, timeRange]);

  const sortedInvestments = useMemo(() => {
    return [...investments].sort((a, b) => {
      if (sortBy === "invested") return Number(b.total_amount) - Number(a.total_amount);
      if (sortBy === "payouts") return (b.metrics?.totalPayouts || 0) - (a.metrics?.totalPayouts || 0);
      return (b.metrics?.annualizedYield || 0) - (a.metrics?.annualizedYield || 0);
    });
  }, [investments, sortBy]);

  const returnRate = totalInvested > 0 ? Math.min((totalLifetimeReturns / totalInvested) * 100, 100) : 0;

  const categoryBreakdown = useMemo(() => {
    if (!investments.length) return [];
    const map = new Map<AssetSector, { invested: number; payouts: number; count: number; dbName: string | null }>();
    investments.forEach(inv => {
      const dbCat = inv.company_pools?.opportunity_categories;
      const sector = (dbCat?.slug as AssetSector | undefined) ?? getAssetSector(inv.company_name || inv.company_pools?.pool_name);
      const existing = map.get(sector) ?? { invested: 0, payouts: 0, count: 0, dbName: null };
      map.set(sector, {
        invested: existing.invested + (inv.metrics?.totalInvested ?? 0),
        payouts:  existing.payouts  + (inv.metrics?.totalPayouts  ?? 0),
        count:    existing.count    + 1,
        dbName:   existing.dbName ?? dbCat?.name ?? null,
      });
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v.invested, 0);
    return Array.from(map.entries())
      .map(([sector, data]) => ({
        sector,
        dbName:   data.dbName,
        pct: total > 0 ? (data.invested / total) * 100 : 0,
        invested: data.invested,
        payouts:  data.payouts,
        yield:    data.invested > 0 ? (data.payouts / data.invested) * 100 : 0,
        count:    data.count,
      }))
      .sort((a, b) => b.invested - a.invested);
  }, [investments]);

  const milestones = useMemo(
    () => getMilestones(investments, totalInvested, totalLifetimeReturns),
    [investments, totalInvested, totalLifetimeReturns],
  );

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      let currentUserId: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        currentUserId = user.id;
        setAuthUserId(user.id);

        // A login can map to more than one investor profile (e.g. a shared family/associate
        // login) — fetch all matches rather than .single(), which errors on >1 row.
        const [{ data: invProfiles }, { data: investData, error: investError }] = await Promise.all([
          supabase.from("investors").select("investor_id, investor_name").eq("user_id", user.id),
          supabase
            .from("investor_investments")
            .select("investment_id, company_name, total_amount, agreement_url, created_at, return_type, company_pools(status, pool_name, opportunity_categories(name, slug, volatility_level))")
            .eq("user_id", user.id),
        ]);

        if (invProfiles && invProfiles.length > 0) {
          setInvestorProfile({
            name: invProfiles.map(p => p.investor_name.trim()).join(" & "),
            id: invProfiles.map(p => p.investor_id).join(","),
          });
        }
        if (investError) throw investError;

        const typedInvestData = (investData as any[]) || [];
        const investmentIds = typedInvestData.map(i => i.investment_id);
        setTotalInvested(typedInvestData.reduce((s, i) => s + Number(i.total_amount), 0));

        // Fetch ALL capital transactions for ALL investments (needed for time-weighted IRR)
        const exitedIds = typedInvestData.filter((i: any) => Number(i.total_amount) === 0).map((i: any) => i.investment_id);
        let capitalTxnsByInv: Record<string, { investment_amount: number; transaction_type: string; created_at: string }[]> = {};

        if (investmentIds.length > 0) {
          const { data: allCapTxns } = await supabase
            .from("investor_transactions")
            .select("investment_id, investment_amount, transaction_type, created_at")
            .in("investment_id", investmentIds)
            .order("created_at", { ascending: true });

          capitalTxnsByInv = (allCapTxns ?? []).reduce((acc: any, tx: any) => {
            if (!acc[tx.investment_id]) acc[tx.investment_id] = [];
            acc[tx.investment_id].push(tx);
            return acc;
          }, {});

          // Flatten for capital timeline, join pool name from typedInvestData
          const poolNameById: Record<string, string> = {};
          typedInvestData.forEach((inv: any) => {
            poolNameById[inv.investment_id] = inv.company_pools?.pool_name ?? inv.company_name ?? "Investment";
          });
          setCapitalTxns((allCapTxns ?? []).map((tx: any) => ({
            ...tx,
            pool_name: poolNameById[tx.investment_id] ?? "Investment",
          })));

          // Build exit date map from withdrawal transactions for exited investments
          if (exitedIds.length > 0) {
            const dateMap: Record<string, string> = {};
            (allCapTxns ?? [])
              .filter((tx: any) => tx.transaction_type === 'withdrawal' && exitedIds.includes(tx.investment_id))
              .forEach((tx: any) => {
                if (!dateMap[tx.investment_id] || tx.created_at > dateMap[tx.investment_id]) {
                  dateMap[tx.investment_id] = tx.created_at;
                }
              });
            setExitDateMap(dateMap);
          }
        }

        // Running capital balance at a specific date for an investment
        const runningBalanceAt = (invId: string, isoDate: string): number => {
          const txns = capitalTxnsByInv[invId] ?? [];
          const pDate = new Date(isoDate).getTime();
          return txns.reduce((sum, tx) => {
            if (new Date(tx.created_at).getTime() <= pDate) {
              return tx.transaction_type === 'add'
                ? sum + Number(tx.investment_amount)
                : sum - Number(tx.investment_amount);
            }
            return sum;
          }, 0);
        };

        // Capital at payout date — if 0 (paid after exit), look at start of payout period
        const getCapitalAtDate = (invId: string, payoutDate: string, monthsConsidered: number = 3): number => {
          const cap = runningBalanceAt(invId, payoutDate);
          if (cap > 0) return cap;
          const periodStart = new Date(payoutDate);
          periodStart.setMonth(periodStart.getMonth() - monthsConsidered);
          const capAtStart = runningBalanceAt(invId, periodStart.toISOString());
          if (capAtStart > 0) return capAtStart;
          // Final fallback: sum of all add transactions
          return (capitalTxnsByInv[invId] ?? [])
            .filter(tx => tx.transaction_type === 'add')
            .reduce((s, tx) => s + Number(tx.investment_amount), 0);
        };

        if (investmentIds.length > 0) {
          const { data: allPayoutsRaw } = await supabase
            .from("investor_quarterly_payments")
            .select("investment_id, gross_roi_amount, net_payable_amount, payment_date, months_considered, emergency_fund_deduction, tds_deduction, quarterly_roi_declarations(quarter_year, month_names)")
            .in("investment_id", investmentIds)
            .not("payment_date", "is", null)
            .order("payment_date", { ascending: true });

          const payoutsByInv = (allPayoutsRaw || []).reduce((acc: Record<string, any[]>, p: any) => {
            if (!acc[p.investment_id]) acc[p.investment_id] = [];
            acc[p.investment_id].push(p);
            return acc;
          }, {});

          let tGross = 0, tEmerg = 0, tTds = 0, tNet = 0;
          let blendedNum = 0, blendedDen = 0;
          let prevYearGross = 0, prevYearWeighted = 0;
          const prevYear = new Date().getFullYear() - 1;

          const processed: Investment[] = typedInvestData.map((inv: any) => {
            const safePayouts: Payout[] = (payoutsByInv[inv.investment_id] || []).map((p: any) => ({
              investment_id: p.investment_id,
              gross_roi_amount: Number(p.gross_roi_amount || 0),
              net_payable_amount: Number(p.net_payable_amount || 0),
              emergency_fund: Number(p.emergency_fund_deduction || 0),
              tds_amount: Number(p.tds_deduction || 0),
              payment_date: p.payment_date,
              months_considered: Number(p.months_considered || 3),
              quarter: p.quarterly_roi_declarations?.quarter_year || "Distribution",
              month_names: p.quarterly_roi_declarations?.month_names || null,
            }));

            const invested = Number(inv.total_amount);
            let totalPayouts = 0, totalGross = 0, totalMonths = 0;
            let weightedIRRNumerator = 0; // sum of (gross_i / capital_i * 12)

            safePayouts.forEach(p => {
              totalPayouts += p.net_payable_amount;
              totalGross += p.gross_roi_amount;
              totalMonths += p.months_considered;
              tGross += p.gross_roi_amount;
              tEmerg += p.emergency_fund;
              tTds += p.tds_amount;
              tNet += p.net_payable_amount;

              // Time-weighted: capital deployed at the time of this payout
              const capitalAtPayout = getCapitalAtDate(inv.investment_id, p.payment_date, p.months_considered);
              if (capitalAtPayout > 0) {
                weightedIRRNumerator += (p.gross_roi_amount / capitalAtPayout) * 12;
              }
            });

            // Time-weighted annualized IRR = sum(gross_i/capital_i * 12) / totalMonths * 100
            const annualizedYield = totalMonths > 0 && weightedIRRNumerator > 0
              ? (weightedIRRNumerator / totalMonths) * 100
              : 0;

            // Use current or last-known capital for blended portfolio weight
            const capitalForBlend = invested > 0 ? invested
              : (capitalTxnsByInv[inv.investment_id] ?? [])
                  .filter(tx => tx.transaction_type === 'add')
                  .reduce((s, tx) => s + Number(tx.investment_amount), 0);

            if (totalMonths > 0 && capitalForBlend > 0 && totalGross > 0) {
              blendedNum += annualizedYield * capitalForBlend;
              blendedDen += capitalForBlend;
            }

            const prevPayouts = safePayouts.filter(p => getPerformanceYear(p.payment_date) === prevYear);
            if (prevPayouts.length > 0) {
              const g = prevPayouts.reduce((s, p) => s + p.gross_roi_amount, 0);
              const m = prevPayouts.reduce((s, p) => s + p.months_considered, 0);
              prevYearGross += g;
              prevYearWeighted += capitalForBlend * (Math.min(m, 12) / 12);
            }

            const lastPayout = safePayouts.length > 0 ? safePayouts[safePayouts.length - 1] : null;

            return {
              ...inv,
              metrics: {
                totalInvested: invested,
                totalPayouts,
                annualizedYield,
                absoluteRoi: invested > 0 ? (totalGross / invested) * 100 : 0,
                payouts: safePayouts,
                lastPayoutAmount: lastPayout?.net_payable_amount || 0,
                lastPayoutDate: lastPayout?.payment_date || null,
              },
            };
          });

          setInvestments(processed);
          setPerfMetrics({ gross: tGross, emergency: tEmerg, tds: tTds });
          setTotalLifetimeReturns(tNet);
          setLastYearYield(blendedDen > 0 ? blendedNum / blendedDen : 0);
          setPrevYearYield(prevYearWeighted > 0 ? (prevYearGross / prevYearWeighted) * 100 : 0);

          // Yearly yields
          const allPayouts = processed.flatMap(i => i.metrics!.payouts);
          const years = Array.from(new Set(allPayouts.map(p => getPerformanceYear(p.payment_date)))).sort((a, b) => b - a);
          setYearlyYields(years.map(year => {
            let totalNet = 0, totalWeighted = 0;
            processed.forEach(inv => {
              const yp = inv.metrics!.payouts.filter(p => getPerformanceYear(p.payment_date) === year);
              if (yp.length > 0) {
                totalNet += yp.reduce((s, p) => s + p.gross_roi_amount, 0);
                totalWeighted += inv.metrics!.totalInvested * (Math.min(yp.reduce((s, p) => s + p.months_considered, 0), 12) / 12);
              }
            });
            return { year, totalPayout: totalNet, yieldPercent: totalWeighted > 0 ? (totalNet / totalWeighted) * 100 : 0 };
          }));

          // Last payout + status
          const sorted = [...allPayouts].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
          if (sorted.length > 0) {
            const latestDate = sorted[0].payment_date;
            const recentSum = sorted.filter(p => p.payment_date === latestDate).reduce((s, p) => s + p.net_payable_amount, 0);
            setLastPayoutAmount(recentSum);
            setLastPayoutDateStr(new Date(latestDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }));
            setPayoutStatus(getPayoutStatus(latestDate));
          } else {
            setPayoutStatus(getPayoutStatus(null));
          }
        } else {
          setPayoutStatus(getPayoutStatus(null));
        }

        // Fetch opportunities (non-blocking)
        fetch("/api/opportunities/investor")
          .then(r => r.json())
          .then(d => setDashOpportunities((d.opportunities ?? []).slice(0, 4)))
          .catch(() => {});

        await logEvent("INFO", "User loaded dashboard overview", {
          userId: currentUserId,
          assetCount: typedInvestData.length,
          totalInvested: typedInvestData.reduce((s: number, i: any) => s + Number(i.total_amount), 0),
        });
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong loading your dashboard. Please refresh to try again.");
        await logEvent("ERROR", "Failed to load dashboard overview", { userId: currentUserId, errorDetails: err.message || err });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [retryCount]);

  const handleExpressInterest = async () => {
    if (!expressInterestTarget || !investorProfile) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: investorProfile.name,
          email: user?.email || "investor@hustlersventures.co",
          subject: `Express Interest - ${expressInterestTarget}`,
          message: `Investor ${investorProfile.name} (${formatInvestorIdLabel(investorProfile.id)}) expressed interest in: ${expressInterestTarget}`,
        }),
      });
      await logEvent("INFO", `Investor expressed interest in ${expressInterestTarget}`, { userId: authUserId, investorId: investorProfile.id }).catch(console.error);
    } catch {
      // intent captured via logEvent - silent fail on email
    }
    setExpressInterestSent(true);
    setTimeout(() => { setExpressInterestTarget(null); setExpressInterestSent(false); }, 2000);
  };

  const handleAssetClick = (inv: Investment) => {
    logEvent("INFO", "User viewed individual asset details", {
      userId: authUserId,
      investmentId: inv.investment_id,
      assetName: inv.company_name || inv.company_pools?.pool_name,
    }).catch(console.error);
    router.push(`/dashboard/portfolio/${inv.investment_id}`);
  };

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-[#0B1120] rounded-2xl p-8">
        <div className="flex justify-between items-start gap-6">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-28 bg-white/10 rounded-full" />
            <div className="h-11 w-56 bg-white/10 rounded-xl" />
            <div className="flex gap-2 mt-2">
              <div className="h-6 w-28 bg-white/10 rounded-full" />
              <div className="h-6 w-24 bg-white/10 rounded-full" />
              <div className="h-6 w-20 bg-white/10 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex gap-3">
              <div className="h-20 w-20 bg-white/5 rounded-xl border border-white/10" />
              <div className="h-20 w-36 bg-white/5 rounded-xl border border-white/10" />
            </div>
            <div className="h-9 w-full bg-white/5 rounded-xl border border-white/10" />
          </div>
        </div>
        <div className="mt-7 pt-6 border-t border-white/[0.06] space-y-2">
          <div className="flex justify-between">
            <div className="h-2.5 w-32 bg-white/10 rounded-full" />
            <div className="h-2.5 w-16 bg-white/10 rounded-full" />
          </div>
          <div className="h-1.5 bg-white/10 rounded-full" />
        </div>
      </div>
      {/* Explore skeleton */}
      <div className="bg-[#0B1120] rounded-2xl p-6 space-y-4">
        <div className="h-7 w-64 bg-white/10 rounded-lg" />
        <div className="h-3 w-40 bg-white/10 rounded-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-44 bg-white/5 rounded-2xl" />)}
        </div>
      </div>
      {/* Asset breakdown skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-36 bg-gray-200 rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-56 bg-white border border-gray-100 rounded-2xl" />)}
        </div>
      </div>
      {/* Chart skeleton */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-56 bg-gray-100 rounded-lg" />
          <div className="h-8 w-32 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex items-end gap-2 pt-4 pb-2 px-2" style={{ height: 260 }}>
          {[60, 80, 45, 90, 70, 55, 85, 65].map((h, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-96 flex flex-col items-center justify-center text-center px-4">
      <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
      <p className="text-gray-700 font-semibold mb-2">Failed to load dashboard</p>
      <p className="text-sm text-gray-400 mb-2">{error}</p>
      {retryCount > 0 && <p className="text-xs text-red-400 mb-4">Still failing - please refresh the page or contact support.</p>}
      <button
        onClick={() => { setError(null); setLoading(true); setRetryCount(c => c + 1); }}
        className="px-5 py-2 bg-[#05CE78] text-black text-sm font-bold rounded-lg hover:bg-[#04b86c] transition-colors"
      >
        {retryCount > 0 ? "Try Again" : "Retry"}
      </button>
    </div>
  );

  const greeting = getGreeting();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-12">
      <SetupNudge />

      {/* HERO HEADER */}
      <div className="relative bg-[#0B1120] rounded-2xl overflow-hidden shadow-xl">
        {/* Atmosphere */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -left-16 w-96 h-96 bg-[#05CE78] opacity-[0.07] rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 opacity-[0.05] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-64 h-32 bg-violet-600 opacity-[0.04] rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>

        <div className="relative z-10 px-6 md:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <greeting.Icon className={`w-4 h-4 ${greeting.color}`} />
                <span className="text-gray-200 text-sm font-medium">{greeting.text}{investorProfile ? `, ${investorProfile.name.split(" ")[0]}` : ""}.</span>
                {milestones.map((m, i) => {
                  const styles: Record<string, string> = {
                    emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
                    blue:    "bg-blue-500/15 border-blue-500/30 text-blue-400",
                    violet:  "bg-violet-500/15 border-violet-500/30 text-violet-400",
                    amber:   "bg-amber-500/15 border-amber-500/30 text-amber-400",
                    teal:    "bg-teal-500/15 border-teal-500/30 text-teal-400",
                    green:   "bg-green-500/15 border-green-500/30 text-green-400",
                  };
                  return (
                    <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${styles[m.color] ?? "bg-white/10 border-white/20 text-gray-400"}`}>
                      <Award className="w-2.5 h-2.5" /> {m.label}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-white/40 font-bold uppercase tracking-[0.18em] mb-2">Capital Deployed</p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                {formatCurrency(totalInvested)}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {totalLifetimeReturns > 0 && (
                  <span className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                    +{formatCurrency(totalLifetimeReturns)} earned
                  </span>
                )}
                {perfMetrics.emergency > 0 && (
                  <span className="relative group flex items-center gap-1.5 bg-blue-500/15 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-500/20 cursor-help">
                    <Hourglass className="w-3 h-3" /> {formatCurrency(perfMetrics.emergency)} in reserve
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-relaxed shadow-xl whitespace-normal font-normal">
                      Emergency fund deducted from gross payouts. Accumulates and is released as a bonus payout at year-end or when the pool closes.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </span>
                )}
                {lastYearYield > 0 && (
                  <span className="flex items-center gap-1 bg-[#05CE78]/15 text-[#05CE78] text-xs font-bold px-2.5 py-1 rounded-full border border-[#05CE78]/20">
                    <TrendingUp className="w-3 h-3" /> {lastYearYield.toFixed(1)}% IRR
                  </span>
                )}
              </div>
              <Link href="/dashboard/insights" className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 font-medium mt-3 transition-colors">
                <Sparkles className="w-3 h-3" /> Simulate compounding on Insights
              </Link>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto md:self-start md:shrink-0">
              <div className="flex gap-3">
                {/* Active Assets */}
                {(() => {
                  const active = investments.filter(i => Number(i.total_amount) > 0).length;
                  const exited = investments.length - active;
                  return (
                    <button
                      type="button"
                      onClick={() => document.getElementById("asset-breakdown")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3 text-center flex-1 transition-colors cursor-pointer"
                    >
                      <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mb-1">Assets</p>
                      <p className="text-xl font-black text-white">{active}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {exited > 0 ? `${exited} exited` : active > 0 ? "all active" : "none yet"}
                      </p>
                    </button>
                  );
                })()}
                {/* Last Payout */}
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center flex-[2]">
                  <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mb-1">Last Payout</p>
                  {lastPayoutAmount > 0 ? (
                    <>
                      <p className="text-xl font-black text-[#05CE78] leading-tight">{formatCurrency(lastPayoutAmount)}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {payoutStatus.status === "processing" ? "next: in progress" : `next: ${payoutStatus.displayDate}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-black text-gray-400 leading-tight">None yet</p>
                      <p className="text-xs text-teal-400 mt-1">{payoutStatus.displayDate}</p>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (isGeneratingPDF) return;
                  setIsGeneratingPDF(true);
                  try {
                    await logEvent("INFO", "User generated Dashboard Portfolio Report", { userId: authUserId, assetCount: investments.length });
                    generatePortfolioPDF(investments, totalInvested, totalLifetimeReturns, investorProfile, perfMetrics, lastPayoutAmount, lastPayoutDateStr, payoutStatus, lastYearYield);
                    showToast("Report downloaded successfully.");
                  } catch {
                    alert("Failed to generate report. Please try again.");
                  } finally {
                    setIsGeneratingPDF(false);
                  }
                }}
                disabled={investments.length === 0 || isGeneratingPDF}
                title={investments.length === 0 ? "No investments yet - report unavailable" : undefined}
                className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 text-gray-300 hover:text-white px-4 py-2 rounded-xl transition-colors border border-white/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm font-bold w-full"
              >
                {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isGeneratingPDF ? "Generating..." : "Portfolio PDF"}
              </button>
            </div>
          </div>

          {/* Integrated progress bar */}
          {totalInvested > 0 && totalLifetimeReturns > 0 && (
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-white/40 font-bold uppercase tracking-[0.15em]">Principal earned back</span>
                <span className="text-xs font-extrabold text-[#05CE78]">{returnRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${returnRate}%`, background: "linear-gradient(90deg, #05CE78 0%, #34d399 60%, #6EF5C0 100%)" }}
                />
              </div>
              <p className="text-xs text-white/25 mt-1.5 font-medium">
                {formatCurrency(totalLifetimeReturns)} received of {formatCurrency(totalInvested)} deployed
              </p>
            </div>
          )}

        </div>
      </div>

      {/* COMPOUND TO CAGR CROSS-SELL */}
      {(() => {
        const xirrInvestments = investments.filter(inv => inv.return_type !== "CAGR" && Number(inv.total_amount) > 0);
        if (xirrInvestments.length === 0) return null;

        const totalPrincipal = xirrInvestments.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
        const singleAssetName = xirrInvestments.length === 1
          ? (xirrInvestments[0].company_name || xirrInvestments[0].company_pools?.pool_name || undefined)
          : undefined;

        const handleCtaClick = () => {
          logEvent("INFO", "User clicked Switch to CAGR cross-sell card", { userId: authUserId, eligibleAssetCount: xirrInvestments.length }).catch(console.error);
          if (xirrInvestments.length === 1) {
            router.push(`/dashboard/returns-example?investmentId=${xirrInvestments[0].investment_id}`);
          } else {
            document.getElementById("asset-breakdown")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        };

        return (
          <SwitchToCagrCard
            totalPrincipal={totalPrincipal}
            eligibleCount={xirrInvestments.length}
            singleAssetName={singleAssetName}
            onCtaClick={handleCtaClick}
          />
        );
      })()}

      {/* EMPTY STATE - only when no investments AND no opportunities to show */}
      {investments.length === 0 && dashOpportunities.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-[#05CE78]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Coins className="w-7 h-7 text-[#05CE78]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Welcome to your portfolio</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
            Your investments will appear here once your account has been set up. Reach out to us to get started.
          </p>
          <Link
            href="/dashboard/opportunities"
            className="inline-flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-black font-bold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            Explore Opportunities <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* EXPLORE INVESTMENT IDEAS */}
      {dashOpportunities.length > 0 && (() => {
        const OPP_COLORS: Record<string, { from: string; to: string; iconBg: string; tagColor: string; yieldColor: string; accent: string }> = {
          transportation: { from: "from-blue-400",   to: "to-indigo-400", iconBg: "bg-blue-50",   tagColor: "bg-blue-100 text-blue-700",     yieldColor: "text-blue-600",   accent: "#3B82F6" },
          hospitality:    { from: "from-purple-400", to: "to-violet-400", iconBg: "bg-purple-50", tagColor: "bg-purple-100 text-purple-700", yieldColor: "text-purple-600", accent: "#8B5CF6" },
          fnb:            { from: "from-orange-400", to: "to-amber-400",  iconBg: "bg-orange-50", tagColor: "bg-orange-100 text-orange-700", yieldColor: "text-orange-600", accent: "#F97316" },
          "debt-funds":   { from: "from-rose-400",   to: "to-pink-400",   iconBg: "bg-rose-50",   tagColor: "bg-rose-100 text-rose-700",     yieldColor: "text-rose-600",   accent: "#F43F5E" },
        };
        const DEFAULT_OPP = { from: "from-[#05CE78]", to: "to-emerald-400", iconBg: "bg-[#05CE78]/10", tagColor: "bg-emerald-100 text-emerald-700", yieldColor: "text-[#05CE78]", accent: "#05CE78" };

        return (
          <div className="bg-[#0B1120] rounded-2xl p-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Explore investment ideas</h2>
                <p className="text-sm text-gray-400 mt-1">Active ideas across all verticals</p>
                <Link href="/dashboard/insights" className="inline-flex items-center gap-1 text-xs text-[#05CE78]/70 hover:text-[#05CE78] font-medium mt-2 transition-colors">
                  <Sparkles className="w-3 h-3" /> Simulate compounding on Insights
                </Link>
              </div>
              <Link href="/dashboard/opportunities" className="text-xs text-[#05CE78] font-semibold hover:text-[#04b86c] transition-colors flex items-center gap-1 pb-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {dashOpportunities.map((o) => {
                const colors = OPP_COLORS[o.opportunity_categories?.slug ?? ""] ?? DEFAULT_OPP;
                const isComingSoon = o.status === "coming_soon";
                const cardContent = (
                  <>
                    <div className={`h-1 bg-gradient-to-r ${colors.from} ${colors.to}`} />
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between">
                        <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0`}>
                          <TrendingUp className="w-5 h-5" style={{ color: colors.accent }} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.tagColor}`}>
                              {o.opportunity_categories?.name ?? "Opportunity"}
                            </span>
                            {o.volatility_level && (
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${
                                o.volatility_level === "Low"    ? "bg-green-50 text-green-700 border-green-200" :
                                o.volatility_level === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                  "bg-red-50 text-red-600 border-red-200"
                              }`} title={o.volatility_note ?? undefined}>
                                {o.volatility_level}
                              </span>
                            )}
                          </div>
                          {isComingSoon && (
                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Coming Soon</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1 line-clamp-1">{o.title}</p>
                        <p className={`text-2xl font-black tracking-tight ${colors.yieldColor}`}>
                          {o.target_irr != null ? `${o.target_irr}% IRR` : "Open"}
                        </p>
                      </div>
                      {o.tenure && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-600">{o.tenure}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 leading-relaxed flex-1 line-clamp-2">{o.tagline ?? ""}</p>
                      <div className="flex items-center gap-1 text-xs font-bold transition-colors" style={{ color: colors.accent }}>
                        {isComingSoon ? "Express Interest" : "Explore"} <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </>
                );
                return isComingSoon ? (
                  <button key={o.id} type="button" onClick={() => setExpressInterestTarget(o.title)}
                    className="group bg-white rounded-2xl border border-white/10 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col text-left w-full">
                    {cardContent}
                  </button>
                ) : (
                  <Link key={o.id} href={o.detail_url ?? "/dashboard/opportunities"}
                    target={o.detail_url ? "_blank" : undefined}
                    rel={o.detail_url ? "noopener noreferrer" : undefined}
                    className="group bg-white rounded-2xl border border-white/10 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* PORTFOLIO MIX */}
      {categoryBreakdown.length >= 2 && (() => {
        const SECTOR_META: Record<AssetSector, { label: string; color: string }> = {
          transportation: { label: "Transportation", color: "#3B82F6" },
          hospitality:    { label: "Hospitality",    color: "#10B981" },
          fnb:            { label: "Highway F&B",    color: "#F97316" },
          debt:           { label: "Debt Funds",     color: "#8B5CF6" },
          portfolio:      { label: "HV Portfolio",   color: "#EC4899" },
        };
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#05CE78]" /> Portfolio Mix
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Donut chart */}
              <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
                <PieChart width={180} height={180}>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="pct"
                    cx={90} cy={90}
                    innerRadius={58} outerRadius={82}
                    strokeWidth={2} stroke="#fff"
                    paddingAngle={2}
                    animationBegin={0} animationDuration={900}
                  >
                    {categoryBreakdown.map((cat, i) => (
                      <Cell key={i} fill={(SECTOR_META[cat.sector] ?? SECTOR_META.portfolio).color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const cat = payload[0].payload;
                      const { label: fallback, color } = SECTOR_META[cat.sector as AssetSector] ?? SECTOR_META.portfolio;
                      return (
                        <div className="bg-[#0B1120] text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-gray-800">
                          <p className="font-bold" style={{ color }}>{cat.dbName ?? fallback}</p>
                          <p className="text-gray-300 mt-0.5">{cat.pct.toFixed(1)}% · {formatCurrency(cat.invested)}</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide leading-none mb-1">Deployed</span>
                  <span className="text-lg font-black text-gray-900 leading-none">{formatCurrencyCompact(totalInvested)}</span>
                </div>
              </div>

              {/* Legend rows */}
              <div className="flex-1 w-full space-y-3">
                {categoryBreakdown.map(cat => {
                  const { label: fallback, color } = SECTOR_META[cat.sector] ?? SECTOR_META.portfolio;
                  const label = cat.dbName ?? fallback;
                  return (
                    <div key={cat.sector} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-700 truncate">{label}</span>
                          <span className="text-sm font-extrabold text-gray-900 shrink-0">{cat.pct.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{formatCurrency(cat.invested)}</span>
                          {cat.payouts > 0 && (
                            <span className="text-xs font-bold text-[#05CE78]">+{cat.yield.toFixed(1)}% yield</span>
                          )}
                          <span className="text-xs text-gray-300">· {cat.count} {cat.count === 1 ? "asset" : "assets"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
                  Allocation by capital deployed.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ASSET BREAKDOWN */}
      <div id="asset-breakdown">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#05CE78]" /> Asset Breakdown
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Sort by</span>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(["invested", "payouts", "irr"] as const).map(key => (
                <button
                  key={key}
                  onClick={() => { setSortBy(key); setPortfolioPage(1); }}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all capitalize ${sortBy === key ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  {key === "irr" ? "IRR" : key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`grid gap-5 grid-cols-1 sm:grid-cols-2 ${sortedInvestments.length > 5 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {sortedInvestments.slice((portfolioPage - 1) * PORTFOLIO_PAGE_SIZE, portfolioPage * PORTFOLIO_PAGE_SIZE).map(inv => {
            const categorySlug = inv.company_pools?.opportunity_categories?.slug
              ?? getAssetSector(inv.company_name || inv.company_pools?.pool_name);
            const SECTOR_ICONS: Record<string, React.ElementType> = {
              transportation: Bus, hospitality: Building2, fnb: Utensils,
              debt: Landmark, portfolio: Briefcase,
            };
            const Icon = SECTOR_ICONS[categorySlug] ?? Building2;
            const categoryLabel = inv.company_pools?.opportunity_categories?.name ?? null;
            const volatility = inv.company_pools?.opportunity_categories?.volatility_level ?? null;
            const VOLATILITY_STYLES: Record<string, string> = {
              Low:    "bg-green-50 text-green-700 border-green-200",
              Medium: "bg-amber-50 text-amber-700 border-amber-200",
              High:   "bg-red-50 text-red-600 border-red-200",
            };
            const ps = getPayoutStatus(inv.metrics?.lastPayoutDate ?? null);
            const isProc = ps.status === "processing";
            const paletteIndex = investments.findIndex(i => i.investment_id === inv.investment_id);
            const accentColor = PALETTE[paletteIndex % PALETTE.length];
            const returnPct = inv.metrics && inv.metrics.totalInvested > 0
              ? Math.min((inv.metrics.totalPayouts / inv.metrics.totalInvested) * 100, 100)
              : 0;
            const isExited = Number(inv.total_amount) === 0;
            return (
              <div
                key={inv.investment_id}
                onClick={() => handleAssetClick(inv)}
                className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col border ${isExited ? "opacity-75" : ""}`}
                style={{ borderColor: isExited ? "#d1d5db" : `${accentColor}30`, boxShadow: isExited ? "0 1px 3px rgba(0,0,0,0.06)" : `0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px ${accentColor}18` }}
              >
                {/* Accent top strip */}
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55)` }} />

                {/* Card header - accent gradient wash */}
                <div
                  className="p-5 flex items-start justify-between gap-3"
                  style={{ background: `linear-gradient(135deg, ${accentColor}14 0%, ${accentColor}05 50%, white 100%)` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${accentColor}22` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#05CE78] transition-colors leading-snug truncate">
                        {inv.company_name || inv.company_pools?.pool_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {isExited ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            Exited
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#05CE78]" />
                            {inv.company_pools?.status || "Active"}
                          </span>
                        )}
                        {categoryLabel && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                            {categoryLabel}
                          </span>
                        )}
                        {volatility && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${VOLATILITY_STYLES[volatility] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                            {volatility} Risk
                          </span>
                        )}
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          · Since {new Date(inv.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          {isExited && exitDateMap[inv.investment_id] && (
                            <span className="text-orange-500 font-medium"> · Closed {new Date(exitDateMap[inv.investment_id]).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  {inv.return_type !== "CAGR" && !isExited && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/dashboard/returns-example?investmentId=${inv.investment_id}`}
                        onClick={e => {
                          e.stopPropagation();
                          logEvent("INFO", "User clicked Convert to CAGR on asset card", { userId: authUserId, investmentId: inv.investment_id }).catch(console.error);
                        }}
                        className="flex items-center gap-1.5 text-s text-white hover:text-white/90 transition-colors font-bold bg-blue-500 hover:bg-blue-500 border border-blue-200 px-2 py-5 rounded-lg whitespace-nowrap"
                      >
                        <RefreshCw className="w-4 h-4" /> Convert to CAGR
                      </Link>
                      <Link
                        href={`/dashboard/returns-example?investmentId=${inv.investment_id}`}
                        onClick={e => {
                          e.stopPropagation();
                          logEvent("INFO", "User viewed CAGR/XIRR example from asset card", { userId: authUserId, investmentId: inv.investment_id }).catch(console.error);
                        }}
                        className="flex items-center justify-center w-[40px] h-[40px] rounded-lg bg-blue-50 border border-blue-200 text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-colors shrink-0"
                        title="See example"
                      >
                        <Info className="w-6 h-6" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Stats 2×2 grid */}
                <div className="grid grid-cols-2 gap-px bg-gray-100/80 border-t border-gray-100 flex-1">
                  <div className="bg-white px-4 py-3.5">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.15em] mb-1.5">{isExited ? "Status" : "Invested"}</p>
                    {isExited
                      ? <p className="text-sm font-bold text-gray-400 leading-none">Capital Returned</p>
                      : <p className="text-base font-black text-gray-900 leading-none">{formatCurrency(Number(inv.total_amount))}</p>
                    }
                  </div>
                  <div className="px-4 py-3.5" style={{ backgroundColor: `${accentColor}0c` }}>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">Lifetime Payouts</p>
                    <p className="text-base font-black leading-none" style={{ color: accentColor }}>
                      {formatCurrency(inv.metrics?.totalPayouts || 0)}
                    </p>
                  </div>
                  <div className="bg-white px-4 py-3.5">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.15em] mb-1.5">Annualised IRR</p>
                    <p className={`text-base font-black leading-none ${inv.metrics && inv.metrics.annualizedYield > 0 ? "text-gray-900" : "text-gray-400"}`}>
                      {inv.metrics?.annualizedYield.toFixed(1)}%
                    </p>
                  </div>
                  {isExited ? (
                    <div className="px-4 py-3.5 bg-gray-50">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.15em] mb-1.5">Payout Status</p>
                      <p className="text-sm font-bold text-gray-400 leading-none">Closed</p>
                    </div>
                  ) : (
                    <div className={`px-4 py-3.5 ${isProc ? "bg-orange-50" : "bg-white"}`}>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">
                        {isProc ? "Awaiting" : "Next Payout"}
                      </p>
                      <p className={`text-sm font-bold leading-none ${isProc ? "text-orange-600" : "text-gray-900"}`}>
                        {ps.displayDate}
                      </p>
                      {isProc ? (
                        <p className="text-xs text-orange-500 mt-1">{ps.message}</p>
                      ) : inv.metrics && inv.metrics.lastPayoutAmount > 0 ? (
                        <p className="text-xs text-gray-400 mt-1">Last: <span className="font-bold text-gray-700">{formatCurrency(inv.metrics.lastPayoutAmount)}</span></p>
                      ) : (
                        <p className="text-xs text-blue-500 mt-1">First payout soon</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Capital returned bar */}
                {returnPct > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-[0.12em]">Capital returned</span>
                      <span className="text-xs font-extrabold" style={{ color: accentColor }}>{returnPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${returnPct}%`, backgroundColor: accentColor }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer actions */}
                <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#05CE78] bg-[#05CE78]/8 border border-[#05CE78]/20 px-2 py-1 rounded-md">
                      <ShieldCheck className="w-3 h-3" /> HV Assured
                    </span>
                    {inv.agreement_url && (
                      <a
                        href={inv.agreement_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium"
                      >
                        <FileText className="w-3 h-3" /> Agreement
                      </a>
                    )}
                    <Link
                      href={`/dashboard/documents?filter=${inv.investment_id}`}
                      onClick={e => {
                        e.stopPropagation();
                        logEvent("INFO", "User navigated to documents from asset breakdown", { userId: authUserId, investmentId: inv.investment_id }).catch(console.error);
                      }}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium"
                    >
                      <FileText className="w-3 h-3" /> Documents
                    </Link>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 group-hover:text-[#05CE78] transition-colors font-medium">View details</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#05CE78] transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedInvestments.length > PORTFOLIO_PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              Showing {Math.min((portfolioPage - 1) * PORTFOLIO_PAGE_SIZE + 1, sortedInvestments.length)}-{Math.min(portfolioPage * PORTFOLIO_PAGE_SIZE, sortedInvestments.length)} of {sortedInvestments.length} assets
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPortfolioPage(p => Math.max(1, p - 1))} disabled={portfolioPage === 1} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:border-[#05CE78] hover:text-[#05CE78] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">← Prev</button>
              {Array.from({ length: Math.ceil(sortedInvestments.length / PORTFOLIO_PAGE_SIZE) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPortfolioPage(p)} className={`w-8 h-8 text-xs font-bold rounded-lg border transition-colors ${p === portfolioPage ? "bg-[#05CE78] text-white border-[#05CE78]" : "border-gray-200 text-gray-500 hover:border-[#05CE78] hover:text-[#05CE78]"}`}>{p}</button>
              ))}
              <button onClick={() => setPortfolioPage(p => Math.min(Math.ceil(sortedInvestments.length / PORTFOLIO_PAGE_SIZE), p + 1))} disabled={portfolioPage === Math.ceil(sortedInvestments.length / PORTFOLIO_PAGE_SIZE)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:border-[#05CE78] hover:text-[#05CE78] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* PAYOUT TRAJECTORY + HISTORICAL PERFORMANCE */}
      {allChartData.length > 0 && <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setChartTab("trajectory")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${chartTab === "trajectory" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Activity className="w-3 h-3" /> <span className="hidden sm:inline">Payout </span>Trajectory
              </button>
              <button
                onClick={() => setChartTab("history")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartTab === "history" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                Historical
              </button>
              <button
                onClick={() => setChartTab("capital")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${chartTab === "capital" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <TrendingUp className="w-3 h-3" /> Capital
              </button>
            </div>
            {chartTab === "trajectory" && (
              <p className="text-xs text-gray-500 hidden sm:block">
                <span className="font-semibold text-gray-700">{formatCurrency(viewTotal)}</span> across{" "}
                <span className="font-semibold text-gray-700">{filteredPayoutCount}</span>{" "}
                {filteredPayoutCount === 1 ? "payout" : "payouts"}
              </p>
            )}
            {chartTab === "capital" && (
              <p className="text-xs text-gray-500 hidden sm:block">
                {capitalTimelineData.length} transaction{capitalTimelineData.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {chartTab === "history" && yearlyYields.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">vs</span>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {(["fd", "nifty"] as const).map(b => (
                  <button key={b} onClick={() => setBenchmark(b)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${benchmark === b ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    {BENCHMARK_META[b].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chartTab === "trajectory" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowGross(!showGross)}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
              >
                {showGross ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {showGross ? "Gross" : "Net"}
              </button>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {(["6M", "1Y", "3Y", "ALL"] as TimeRange[]).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === range ? "bg-[#05CE78] text-black shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {chartTab === "capital" ? (
          <div className="w-full">
            {capitalTimelineData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-gray-300 gap-2">
                <TrendingUp className="w-8 h-8 opacity-50" />
                <p className="text-xs font-medium">No capital transactions recorded yet.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={capitalTimelineData} margin={{ top: 10, right: 4, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#05CE78" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#05CE78" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="idx"
                      type="number"
                      domain={[0, capitalTimelineData.length - 1]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 600 }}
                      interval="preserveStartEnd"
                      tickFormatter={(i: number) => capitalTimelineData[i]?.label ?? ""}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      tickFormatter={(v: number) => v >= 10000000 ? `₹${(v/10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as CapitalTimelinePoint;
                        if (d.delta === 0) return null;
                        return (
                          <div className="bg-[#0B1120] text-white text-xs p-4 rounded-xl shadow-xl border border-gray-800 w-56">
                            <p className="font-bold text-gray-200 text-sm mb-1">
                              {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                            <p className="text-gray-400 mb-2">{d.pool_name}</p>
                            <div className={`flex items-center gap-1.5 font-bold mb-2 ${d.type === "add" ? "text-[#05CE78]" : "text-red-400"}`}>
                              {d.type === "add" ? "+" : "-"}{formatCurrency(d.delta)}
                            </div>
                            <div className="border-t border-gray-700 pt-2 flex justify-between">
                              <span className="text-gray-400">Cumulative at this date</span>
                              <span className="font-bold text-white">{formatCurrency(d.cumulative)}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#05CE78"
                      strokeWidth={2.5}
                      fill="url(#capitalGradient)"
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload.delta === 0) return <g key={`dot-${cx}-${cy}`} />;
                        return (
                          <circle
                            key={`dot-${cx}-${cy}`}
                            cx={cx} cy={cy} r={5}
                            fill={payload.type === "add" ? "#05CE78" : "#EF4444"}
                            stroke="#fff" strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={{ r: 6, fill: "#05CE78", stroke: "#fff", strokeWidth: 2 }}
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 text-xs text-gray-400 px-1 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#05CE78] inline-block" /> Capital added</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Withdrawal</span>
                  <span className="ml-auto font-semibold text-gray-500">
                    Current total: <span className="text-gray-900 font-bold">{formatCurrency(capitalTimelineData[capitalTimelineData.length - 1]?.cumulative ?? 0)}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        ) : chartTab === "trajectory" ? (
          <div className="w-full">
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-gray-300 gap-2">
                <Calendar className="w-8 h-8 opacity-50" />
                {allChartData.length === 0 ? (
                  <p className="text-xs font-medium">No payouts received yet.</p>
                ) : (
                  <>
                    <p className="text-xs font-medium">No payouts in this period.</p>
                    <button onClick={() => setTimeRange("ALL")} className="text-xs text-[#05CE78] font-bold hover:underline">View all time</button>
                  </>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={filteredData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={(props: any) => {
                      const { x, y, payload } = props;
                      const dataPoint = filteredData[payload.index];
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={10} fontWeight="bold">{payload.value}</text>
                          {dataPoint?.monthNames && (
                            <text x={0} y={0} dy={28} textAnchor="middle" fill="#9CA3AF" fontSize={9}>({dataPoint.monthNames})</text>
                          )}
                        </g>
                      );
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(val: number) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`} />
                  <Tooltip
                    cursor={{ fill: "#f9fafb" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ChartDataPoint;
                        return (
                          <div className="bg-[#0B1120] text-white text-xs p-4 rounded-xl shadow-xl border border-gray-800 w-60">
                            <div className="border-b border-gray-700 pb-2 mb-2">
                              <p className="font-bold text-gray-200 text-sm">{label}</p>
                              {data.monthNames && <p className="text-gray-400 text-xs mt-0.5">{data.monthNames as string}</p>}
                            </div>
                            <div className="space-y-1.5">
                              {investments.map((inv, index) => {
                                const val = (data[`inv_${index}_${showGross ? "gross" : "net"}`] as number) || 0;
                                if (!val) return null;
                                return (
                                  <div key={inv.investment_id} className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PALETTE[index % PALETTE.length] }} />
                                      <span className="text-gray-400 truncate">{inv.company_name || inv.company_pools?.pool_name || "Asset"}</span>
                                    </div>
                                    <span className="font-medium text-gray-200 shrink-0">{formatCurrency(val)}</span>
                                  </div>
                                );
                              })}
                              <div className="flex justify-between border-t border-gray-700 pt-2 mt-1">
                                <span className="font-bold text-gray-200">Total {showGross ? "Gross" : "Net"}:</span>
                                <span className="font-bold text-[#05CE78]">{formatCurrency(showGross ? data.grossValue : data.netValue)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {investments.map((inv, index) => (
                    <Bar
                      key={inv.investment_id}
                      dataKey={`inv_${index}_${showGross ? "gross" : "net"}`}
                      stackId="a"
                      fill={PALETTE[index % PALETTE.length]}
                      radius={index === investments.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      barSize={40}
                      animationDuration={1500}
                      name={inv.company_name || inv.company_pools?.pool_name || "Asset"}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
            {investments.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 pt-3 border-t border-gray-100">
                {investments.map((inv, index) => (
                  <div key={inv.investment_id} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[index % PALETTE.length] }} />
                    <span className="text-xs text-gray-500">{inv.company_name || inv.company_pools?.pool_name || "Asset"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-w-lg">
            {yearlyYields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No yield data yet.</p>
            ) : (() => {
              const bmData = BENCHMARKS[benchmark];
              const bmMeta = BENCHMARK_META[benchmark];
              const maxY = Math.max(
                ...yearlyYields.map(y => y.yieldPercent),
                ...yearlyYields.map(y => Math.max(bmData[y.year] ?? 0, 0)),
                1
              );
              return yearlyYields.map(y => {
                const barW = Math.round((y.yieldPercent / maxY) * 100);
                const color = y.yieldPercent >= 22 ? "#05CE78" : y.yieldPercent >= 15 ? "#F59E0B" : "#9CA3AF";
                const bmVal = bmData[y.year] ?? null;
                const bmBarW = bmVal !== null ? Math.round((Math.max(bmVal, 0) / maxY) * 100) : null;
                const diff = bmVal !== null ? y.yieldPercent - bmVal : null;
                return (
                  <div key={y.year} className="space-y-2.5">
                    {/* Investor bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-gray-700 shrink-0">{y.year}</span>
                          {diff !== null && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0 ${diff >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                              {diff >= 0 ? "+" : ""}{diff.toFixed(1)}% vs {bmMeta.label}
                            </span>
                          )}
                        </div>
                        <span className="text-base font-extrabold shrink-0" style={{ color }}>{y.yieldPercent.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${barW}%`, backgroundColor: color }} />
                      </div>
                    </div>
                    {/* Benchmark bar */}
                    {bmVal !== null && bmBarW !== null && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{bmMeta.label}</span>
                          <span className="text-xs font-semibold text-gray-400">{bmVal > 0 ? bmVal.toFixed(1) : bmVal.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${bmBarW}%`, backgroundColor: bmMeta.color }} />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">{formatCurrency(y.totalPayout)} gross earned</p>
                  </div>
                );
              });
            })()}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2 rounded-sm bg-[#05CE78] inline-block" /> Your returns</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-sm bg-[#94A3B8] inline-block" /> {BENCHMARK_META[benchmark].label}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <Activity className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                <span>Yield calculated on time-weighted capital deployed. {benchmark === "nifty" && "Nifty 50 CY returns, 2025 is partial-year estimate."}{benchmark === "fd" && "FD rate: SBI 1-year fixed deposit."}</span>
              </div>
            </div>
          </div>
        )}
      </div>}

      {(() => {
        const now = new Date();
        const month = now.getMonth(); // 0=Jan … 11=Dec
        const year = now.getFullYear();
        // Show April (3) through September (8) - tax filing season
        if (month < 3 || month > 8) return null;
        // Previous FY: Apr-Dec of Y → FY (Y-1)-Y; Jan-Mar of Y → FY (Y-2)-(Y-1)
        const fyStart = month >= 3 ? year - 1 : year - 2;
        const fyLabel = `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`;
        return (
          <div className="flex items-center justify-center gap-2 text-xs py-4 bg-amber-50 border border-amber-100 rounded-xl px-4">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-amber-700 font-medium">{fyLabel} Tax Documents are available. Download from the <Link href="/dashboard/documents" className="underline underline-offset-2 hover:text-amber-900">Documents</Link> section.</p>
          </div>
        );
      })()}

      {/* EXPRESS INTEREST MODAL */}
      {expressInterestTarget && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setExpressInterestTarget(null); setExpressInterestSent(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  expressInterestTarget === "Debt Fund" ? "bg-blue-50"
                  : expressInterestTarget === "HV Portfolio" ? "bg-orange-50"
                  : "bg-amber-50"
                }`}>
                  {expressInterestTarget === "Debt Fund"
                    ? <TrendingUp className="w-5 h-5 text-blue-500" />
                    : expressInterestTarget === "HV Portfolio"
                    ? <Briefcase className="w-5 h-5 text-orange-500" />
                    : <Banknote className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{expressInterestTarget}</h3>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
              </div>
              <button
                onClick={() => { setExpressInterestTarget(null); setExpressInterestSent(false); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              {expressInterestTarget === "Debt Fund"
                ? "12% p.a., no exit load, 3-month minimum - a liquid option for parking your payouts between deployment windows."
                : expressInterestTarget === "HV Portfolio"
                ? "30-40% IRR, ₹50L minimum ticket, 10-year horizon with a 5-year lock-in. Institutional-grade portfolio across our best-performing Fleet, Hospitality & F&B assets."
                : "Guaranteed returns with full liquidity on maturity - ideal for capital you're not ready to deploy yet."}
              {" "}We're setting this up and will reach out as soon as it's available.
            </p>

            {investorProfile && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#05CE78]/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#05CE78]">{investorProfile.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{investorProfile.name}</p>
                  <p className="text-xs text-gray-400">Interest will be noted under your account</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setExpressInterestTarget(null); setExpressInterestSent(false); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >
                Not now
              </button>
              <button
                onClick={handleExpressInterest}
                disabled={expressInterestSent}
                className="flex-1 px-4 py-2.5 bg-[#05CE78] hover:bg-[#04b86c] text-black font-bold text-sm rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {expressInterestSent
                  ? <><CheckCircle className="w-4 h-4" /> Interest noted</>
                  : <>Express Interest <ArrowUpRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle className="w-4 h-4 text-[#05CE78] shrink-0" />
          {toastMessage}
        </div>
      )}

    </div>
  );
}
