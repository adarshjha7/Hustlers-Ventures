"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/logger";
import { formatCurrency, isTransportationAsset } from "@/lib/formatters";
import {
  ArrowLeft, Building2, Bus, Calendar, Activity, Clock,
  FileText, Loader2, Coins, Copy, CheckCircle, Wallet, ShieldAlert, TrendingUp, ExternalLink, Info,
  ArrowDownCircle, ArrowUpCircle, Utensils, Landmark, Briefcase, Download, RefreshCw, Archive,
} from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- TYPES ---
interface CapitalTransaction {
  transaction_id: string;
  investment_amount: number;
  transaction_type: "add" | "withdrawal";
  remarks: string | null;
  receipt_url: string | null;
  created_at: string;
}

interface Transaction {
  payment_id: string;
  payment_date: string;
  net_payable_amount: number;
  gross_roi_amount: number;
  tds_amount: number;
  emergency_fund: number;
  fd_returns: number;
  roi_percentage: number;
  months_considered: number;
  transaction_annualized_roi: number;
  receipt_url: string | null; 
  quarter: string;
  month_names: string | null;
  dateObj: Date; 
}

interface AssetDetails {
  id: string;
  name: string;
  type: 'Bus' | 'Real Estate';
  returnType: "CAGR" | "XIRR";
  categoryName: string | null;
  categorySlug: string | null;
  volatilityLevel: string | null;
  status: string;
  investedDate: string;
  closedDate: string | null;
  investedAmount: number;
  originalInvested: number;
  agreementUrl: string | null;
  lifetimeNet: number;
  lifetimeGross: number; 
  lifetimeTDS: number;
  lifetimeEmergencyFund: number;
  lifetimeFDReturns: number;
  totalMonthsConsidered: number;
  annualizedReturns: number; 
  transactions: Transaction[];
}


function generateStatementPDF(asset: AssetDetails, investorName: string | null) {
  const doc = new jsPDF();
  const safeFormatIN = (val: number) => {
    const s = Math.round(val).toString();
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    return (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "") + last3;
  };
  const fmt = (val: number) => `Rs. ${safeFormatIN(val)}`;

  doc.setFontSize(24); doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 17, 32); doc.text("HUSTLERS", 14, 22);
  doc.setTextColor(5, 206, 120); doc.text("VENTURES", 14, 30);
  doc.setFontSize(16); doc.setTextColor(11, 17, 32);
  doc.text(`Asset Statement: ${asset.name}`, 196, 22, { align: "right" });
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}`, 196, 30, { align: "right" });
  doc.setDrawColor(230, 230, 230); doc.line(14, 38, 196, 38);

  const capital = asset.investedAmount > 0 ? asset.investedAmount : asset.originalInvested;
  const totalMonths = asset.transactions.reduce((s, t) => s + t.months_considered, 0);
  const weightedNumerator = capital > 0
    ? asset.transactions.reduce((s, t) => s + (t.gross_roi_amount / capital) * 12, 0)
    : 0;
  const annIrr = totalMonths > 0 && weightedNumerator > 0 ? (weightedNumerator / totalMonths) * 100 : 0;

  autoTable(doc, {
    startY: 46,
    head: [["Investor", "Invested Amount", "Total Net Payout", "Emergency Fund", "TDS Deducted", "Annualised IRR"]],
    body: [[
      investorName ?? "—", fmt(capital), fmt(asset.lifetimeNet),
      `- ${fmt(asset.lifetimeEmergencyFund)}`, `- ${fmt(asset.lifetimeTDS)}`, `${annIrr.toFixed(2)}%`,
    ]],
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 10, fontStyle: "bold", textColor: [11, 17, 32], cellPadding: 6 },
  });

  const currentY = (doc as any).lastAutoTable.finalY + 10;

  const rows = [...asset.transactions]
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .map(t => [
      t.payment_date,
      t.month_names ? `${t.quarter} (${t.month_names})` : t.quarter,
      safeFormatIN(t.gross_roi_amount),
      `-${safeFormatIN(t.emergency_fund)}`,
      `-${safeFormatIN(t.tds_amount)}`,
      safeFormatIN(t.net_payable_amount),
      `${t.transaction_annualized_roi.toFixed(2)}%`,
    ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Payout Date", "Period", "Gross", "Emergency", "TDS", "Net Payout", "IRR %"]],
    body: rows.length > 0 ? rows : [["No payouts yet", "", "", "", "", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 4, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  doc.save(`${asset.name.replace(/\s+/g, "-")}-Statement-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function AssetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [asset, setAsset] = useState<AssetDetails | null>(null);
  const [investorName, setInvestorName] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [zippingReceipts, setZippingReceipts] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [capitalTransactions, setCapitalTransactions] = useState<CapitalTransaction[]>([]);
  const [ledgerPage, setLedgerPage] = useState(1);
  const LEDGER_PAGE_SIZE = 10;
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  // Receipts are a mix of Google Drive share links, direct files, and storage paths — resolving
  // them requires server-side access (Drive API + no browser CORS restriction), so this just
  // calls the API route (scoped to this one investment) and streams back the finished ZIP.
  const handleDownloadAllReceipts = async () => {
    if (zippingReceipts || !asset) return;
    setZippingReceipts(true);
    try {
      const res = await fetch(`/api/dashboard/receipts/zip?investmentId=${asset.id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const successCount = Number(res.headers.get('X-Receipt-Success-Count') || 0);
      const failedCount = Number(res.headers.get('X-Receipt-Failed-Count') || 0);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payout-Receipts-${asset.name.replace(/[\\/:*?"<>|]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (failedCount > 0) {
        alert(`Downloaded ${successCount} receipt${successCount !== 1 ? "s" : ""}. ${failedCount} could not be fetched.`);
      }
    } catch (err: any) {
      console.error("Failed to download receipts ZIP:", err);
      alert(err.message || "Could not create the ZIP file. Please try again.");
    } finally {
      setZippingReceipts(false);
    }
  };


  useEffect(() => {
    async function fetchAssetDetails() {
      if (!params.id) return;
      let currentUserId: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        currentUserId = user.id;
        setAuthUserId(user.id);

        // A login can map to more than one investor profile (e.g. a shared family/associate
        // login) — fetch all matches rather than .single(), which errors on >1 row.
        supabase.from("investors").select("investor_name").eq("user_id", user.id)
          .then(({ data: rows }) => {
            if (rows && rows.length > 0) setInvestorName(rows.map(r => r.investor_name.trim()).join(" & "));
          });

        const { data: inv, error } = await supabase
          .from('investor_investments')
          .select(`investment_id, total_amount, company_name, created_at, agreement_url, return_type, company_pools ( pool_name, status, opportunity_categories ( name, slug, volatility_level ) )`)
          .eq('investment_id', params.id)
          .single();

        if (error || !inv) throw new Error("Asset not found");

        const [{ data: payouts }, { data: capitalTxns }] = await Promise.all([
          supabase
            .from('investor_quarterly_payments')
            .select(`
              payment_id, payment_date, net_payable_amount, gross_roi_amount, fd_returns, months_considered, emergency_fund_deduction, tds_deduction, receipt_url,
              quarterly_roi_declarations ( quarter_year, roi_percentage, month_names )
            `)
            .eq('investment_id', params.id)
            .order('payment_date', { ascending: false }),
          supabase
            .from('investor_transactions')
            .select('transaction_id, investment_amount, transaction_type, remarks, receipt_url, created_at')
            .eq('investment_id', params.id)
            .order('created_at', { ascending: false }),
        ]);

        const invested = Number(inv.total_amount);

        // Sort capital txns by date ascending for running balance
        const sortedCapTxns = [...(capitalTxns ?? [])].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Running capital balance at a specific date
        const runningBalanceAt = (isoDate: string): number => {
          const pDate = new Date(isoDate).getTime();
          return sortedCapTxns.reduce((sum, tx) => {
            if (new Date(tx.created_at).getTime() <= pDate) {
              return tx.transaction_type === 'add'
                ? sum + Number(tx.investment_amount)
                : sum - Number(tx.investment_amount);
            }
            return sum;
          }, 0);
        };

        // Capital at payout date — if 0 (paid after exit), use start of payout period
        // (payout may have been processed after investor withdrew capital)
        const getCapitalAtDate = (payoutDate: string, monthsConsidered: number = 3): number => {
          const cap = runningBalanceAt(payoutDate);
          if (cap > 0) return cap;
          // Look at start of payout period
          const periodStart = new Date(payoutDate);
          periodStart.setMonth(periodStart.getMonth() - monthsConsidered);
          const capAtStart = runningBalanceAt(periodStart.toISOString());
          if (capAtStart > 0) return capAtStart;
          // Final fallback: original invested capital
          return originalInvested;
        };

        // Total capital ever invested (for display and fallback)
        const originalInvested = sortedCapTxns
          .filter(t => t.transaction_type === 'add')
          .reduce((sum, t) => sum + Number(t.investment_amount), 0);

        // Fetch exit date for exited investments
        let closedDate: string | null = null;
        if (invested === 0) {
          const lastWithdrawal = (capitalTxns ?? [])
            .filter(t => t.transaction_type === 'withdrawal')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          if (lastWithdrawal) {
            closedDate = new Date(lastWithdrawal.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          }
        }

        setCapitalTransactions(capitalTxns ?? []);

        let totalNet = 0;
        let totalGross = 0;
        let totalTDS = 0;
        let totalEmergencyFund = 0;
        let totalFDReturns = 0;
        let totalMonths = 0;

        const transactions = payouts?.map((p: any) => {
          const gross = Number(p.gross_roi_amount || 0);
          const net = Number(p.net_payable_amount || 0);
          
          const emergency = Number(p.emergency_fund_deduction || 0);
          const tds = Number(p.tds_deduction || 0);
          
          const fdReturns = Number(p.fd_returns || 0);
          const roiPercentage = Number(p.quarterly_roi_declarations?.roi_percentage || 0);
          const months = Number(p.months_considered || 3); 
          
          totalNet += net;
          totalGross += gross;
          totalTDS += tds;
          totalEmergencyFund += emergency;
          totalFDReturns += fdReturns;
          totalMonths += months;

          const capitalAtPayout = p.payment_date ? getCapitalAtDate(p.payment_date, months) : 0;
          const transactionAnnualizedRoi = capitalAtPayout > 0 ? ((gross / capitalAtPayout) * (12 / months)) * 100 : 0;

          return {
            payment_id: p.payment_id,
            payment_date: new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            dateObj: new Date(p.payment_date),
            net_payable_amount: net,
            gross_roi_amount: gross,
            tds_amount: tds,
            emergency_fund: emergency,
            fd_returns: fdReturns,
            roi_percentage: roiPercentage,
            months_considered: months,
            transaction_annualized_roi: transactionAnnualizedRoi,
            receipt_url: p.receipt_url || null, 
            quarter: p.quarterly_roi_declarations?.quarter_year || "Distribution",
            month_names: p.quarterly_roi_declarations?.month_names || null
          };
        }) || [];

        const poolData = inv.company_pools as any;
        const name = inv.company_name || poolData.pool_name || "Asset";

        // Time-weighted annualized IRR: sum(gross_i/capital_i * 12) / totalMonths * 100
        const weightedIRRNumerator = (payouts ?? []).reduce((sum: number, p: any) => {
          if (!p.payment_date) return sum;
          const months = Number(p.months_considered || 3);
          const capital = getCapitalAtDate(p.payment_date, months);
          const gross = Number(p.gross_roi_amount || 0);
          return capital > 0 ? sum + (gross / capital) * 12 : sum;
        }, 0);
        const annualized = totalMonths > 0 && weightedIRRNumerator > 0
          ? (weightedIRRNumerator / totalMonths) * 100
          : 0;

        setAsset({
          id: inv.investment_id,
          name: name,
          type: isTransportationAsset(name) ? 'Bus' : 'Real Estate',
          returnType: (inv.return_type as "CAGR" | "XIRR") ?? "CAGR",
          categoryName: poolData?.opportunity_categories?.name ?? null,
          categorySlug: poolData?.opportunity_categories?.slug ?? null,
          volatilityLevel: poolData?.opportunity_categories?.volatility_level ?? null,
          status: poolData?.status || "Active",
          investedDate: new Date(inv.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          closedDate,
          investedAmount: invested,
          originalInvested,
          agreementUrl: inv.agreement_url,
          lifetimeNet: totalNet,
          lifetimeGross: totalGross,
          lifetimeTDS: totalTDS,
          lifetimeEmergencyFund: totalEmergencyFund,
          lifetimeFDReturns: totalFDReturns,
          totalMonthsConsidered: totalMonths,
          annualizedReturns: annualized,
          transactions: transactions
        });

        await logEvent('INFO', 'User loaded individual asset page', { userId: currentUserId, assetId: params.id, assetName: name });

      } catch (err: any) { 
        console.error(err); 
        await logEvent('ERROR', 'Failed to load individual asset page', { userId: currentUserId, assetId: params.id, errorDetails: err.message || err });
      } finally { 
        setLoading(false); 
      }
    }
    fetchAssetDetails();
  }, [params.id, router]);

  const timelineEvents = useMemo(() => {
    if (!asset) return [];
    const events: Array<{
      date: Date;
      dateStr: string;
      type: "capital_add" | "capital_withdrawal" | "payout";
      amount: number;
      label: string;
      note?: string;
    }> = [];

    [...capitalTransactions]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach(t => {
        events.push({
          date: new Date(t.created_at),
          dateStr: new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          type: t.transaction_type === "add" ? "capital_add" : "capital_withdrawal",
          amount: Number(t.investment_amount),
          label: t.transaction_type === "add" ? "Capital Deployed" : "Capital Withdrawn",
          note: t.remarks || undefined,
        });
      });

    [...asset.transactions]
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .forEach(t => {
        events.push({
          date: t.dateObj,
          dateStr: t.payment_date,
          type: "payout",
          amount: t.net_payable_amount,
          label: t.quarter !== "Distribution" ? `${t.quarter} Payout` : "Distribution",
          note: t.month_names || undefined,
        });
      });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [asset, capitalTransactions]);

  const chartData = useMemo(() => {
    if (!asset || asset.transactions.length === 0) return [];
    
    return [...asset.transactions]
      .sort((a, b) => {
        // 1. Primary Sort: By Date Ascending
        const dateDiff = a.dateObj.getTime() - b.dateObj.getTime();
        if (dateDiff !== 0) return dateDiff;
        
        // 2. Secondary Sort (Tie-Breaker): If two payouts fall on the exact same date, sort by the Quarter label!
        if (a.quarter && b.quarter && a.quarter.includes('-') && b.quarter.includes('-')) {
          const [qA, yA] = a.quarter.split('-');
          const [qB, yB] = b.quarter.split('-');
          if (yA !== yB) return Number(yA) - Number(yB);
          return qA.localeCompare(qB);
        }
        return 0;
      })
      .map(t => ({
        name: t.quarter.includes('Q') ? t.quarter : t.payment_date.split(' ')[1], 
        monthNames: t.month_names,
        amount: t.net_payable_amount,
        fullDate: t.payment_date,
        gross: t.gross_roi_amount,
        emergency: t.emergency_fund,
        tds: t.tds_amount
      }));
  }, [asset]);

  const copyToClipboard = () => {
    if (!asset?.id) return;
    navigator.clipboard.writeText(asset.id);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    logEvent('INFO', 'User copied Asset ID', { userId: authUserId, assetId: asset.id }).catch(console.error);
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="h-56 rounded-2xl bg-gray-200 animate-pulse" />
      <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: "60ms" }} />
      <div className="h-72 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: "120ms" }} />
      <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: "180ms" }} />
    </div>
  );
  if (!asset) return <div className="p-8 text-center text-gray-500">Asset not found.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-12">
      
      {/* 2. HERO ASSET CARD */}
      <div className="bg-[#0B1120] rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[900px] h-[500px] bg-[#05CE78]/10 blur-[120px] rounded-full" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          <div className="absolute w-[400px] h-[200px] bg-[#05CE78]/8 blur-[80px] rounded-full" style={{ top: "33%", left: "50%", transform: "translate(-50%, -50%)" }} />
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-white">
          {(() => {
            const SECTOR_ICONS: Record<string, React.ElementType> = { transportation: Bus, hospitality: Building2, fnb: Utensils, debt: Landmark, portfolio: Briefcase };
            const WmIcon = SECTOR_ICONS[asset.categorySlug ?? ""] ?? (isTransportationAsset(asset.name) ? Bus : Building2);
            return <WmIcon className="w-64 h-64" />;
          })()}
        </div>

        <div className="relative z-10 p-6">
          <button onClick={() => router.push('/dashboard')} className="flex items-center text-xs text-gray-400 hover:text-white transition-colors font-medium mb-4">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
            <div>
              {(() => {
                const SECTOR_ICONS: Record<string, React.ElementType> = {
                  transportation: Bus, hospitality: Building2, fnb: Utensils,
                  debt: Landmark, portfolio: Briefcase,
                };
                const slug = asset.categorySlug ?? (isTransportationAsset(asset.name) ? "transportation" : "hospitality");
                const Icon = SECTOR_ICONS[slug] ?? Building2;
                const RISK_STYLES: Record<string, string> = {
                  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                  High: "text-red-400 bg-red-500/10 border-red-500/20",
                };
                return (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border bg-blue-500/10 text-blue-300 border-blue-500/20">
                  <Icon className="w-3 h-3" />
                  {asset.categoryName ?? `${asset.type} Fund`}
                </span>
                {asset.volatilityLevel && (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${RISK_STYLES[asset.volatilityLevel] ?? "text-gray-400 bg-white/10 border-white/10"}`}>
                    {asset.volatilityLevel} Risk
                  </span>
                )}
                {asset.investedAmount === 0 ? (
                  <span className="flex items-center text-orange-400 text-xs font-bold bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-1.5" />
                    Exited
                  </span>
                ) : (
                  <span className="flex items-center text-[#05CE78] text-xs font-bold bg-[#05CE78]/10 px-2.5 py-1 rounded-md border border-[#05CE78]/20">
                    <div className="w-1.5 h-1.5 bg-[#05CE78] rounded-full mr-1.5 animate-pulse" />
                    {asset.status}
                  </span>
                )}
              </div>
                );
              })()}
              <h1 className="text-2xl font-extrabold text-white leading-tight">{asset.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-400 font-medium flex-wrap">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-500" /> Invested {asset.investedDate}</span>
                {asset.closedDate && (
                  <span className="flex items-center gap-1.5 text-orange-400">
                    <span className="text-gray-600">·</span> Closed {asset.closedDate}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
               {asset.returnType !== "CAGR" && asset.investedAmount > 0 && (
                 <Link
                   href={`/dashboard/returns-example?investmentId=${asset.id}`}
                   onClick={() => {
                     logEvent('INFO', 'User clicked Convert to CAGR on asset detail page', { userId: authUserId, assetId: asset.id }).catch(console.error);
                   }}
                   className="flex items-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-white px-6 py-3 rounded-xl text-base font-bold transition-all shadow-md"
                 >
                   <RefreshCw className="w-5 h-5" /> Convert to CAGR
                 </Link>
               )}
               {asset.agreementUrl && (
                 <a
                   href={asset.agreementUrl} target="_blank" rel="noreferrer"
                   onClick={() => logEvent('INFO', 'User viewed asset agreement', { userId: authUserId, assetId: asset.id }).catch(console.error)}
                   className="flex items-center gap-2 bg-[#05CE78] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#04b86b] transition-all shadow-md"
                 >
                   <FileText className="w-4 h-4" /> Agreement
                 </a>
               )}
            </div>
          </div>

          {/* Primary row: the 4 numbers investors care most about */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Wallet className="w-3 h-3 text-gray-500" /> Invested
              </p>
              <p className="text-base font-extrabold text-white">
                {formatCurrency(asset.investedAmount > 0 ? asset.investedAmount : asset.originalInvested)}
              </p>
              {asset.investedAmount === 0 && (
                <p className="text-xs text-orange-400 mt-0.5 font-medium">Capital returned</p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Net Payout</p>
              <p className="text-lg font-extrabold text-[#05CE78]">{formatCurrency(asset.lifetimeNet)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Gross Revenue</p>
              <p className="text-base font-bold text-gray-300">{formatCurrency(asset.lifetimeGross)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Annualised IRR</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-extrabold text-purple-400">{asset.annualizedReturns.toFixed(2)}%</p>
                {asset.annualizedReturns > 0 && <Activity className="w-4 h-4 text-purple-500" />}
              </div>
            </div>
          </div>

          {/* Secondary row: deductions - only shown when non-zero */}
          {(asset.lifetimeFDReturns > 0 || asset.lifetimeEmergencyFund > 0 || asset.lifetimeTDS > 0) && (
            <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-white/5 pt-4 mt-1">
              {asset.lifetimeFDReturns > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-blue-400" /> FD Returns
                    <span title="Interest earned on the emergency fund corpus kept in a fixed deposit on your behalf." className="cursor-help">
                      <Info className="w-3 h-3 text-gray-600 opacity-60 pointer-events-none" />
                    </span>
                  </p>
                  <p className="text-sm font-bold text-blue-300">+{formatCurrency(asset.lifetimeFDReturns)}</p>
                </div>
              )}

              {asset.lifetimeEmergencyFund > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-orange-400" /> Emergency Fund
                    <span title="A small reserve withheld from each payout to cover unexpected operational costs. Returned at asset exit." className="cursor-help">
                      <Info className="w-3 h-3 text-gray-600 opacity-60 pointer-events-none" />
                    </span>
                  </p>
                  <p className="text-sm font-bold text-orange-300">-{formatCurrency(asset.lifetimeEmergencyFund)}</p>
                </div>
              )}

              {asset.lifetimeTDS > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    TDS (10%)
                    <span title="Tax Deducted at Source at 10% on your gross payout, as required by Indian income tax law." className="cursor-help">
                      <Info className="w-3 h-3 text-gray-600 opacity-60 pointer-events-none" />
                    </span>
                  </p>
                  <p className="text-sm font-bold text-red-400">-{formatCurrency(asset.lifetimeTDS)}</p>
                </div>
              )}
            </div>
          )}
          <div className="border-t border-white/5 pt-3 mt-2 flex items-center justify-between">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {copied ? <CheckCircle className="w-3 h-3 text-[#05CE78]" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : `Investment ID: ${asset.id.slice(0, 8)}...`}
            </button>
          </div>
        </div>
      </div>

      {/* 3. INVESTMENT TIMELINE */}
      {timelineEvents.length > 0 && (() => {
        let cumulativeEarned = 0;
        return (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-[#05CE78]" />
            <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#05CE78]" /> Investment Timeline
              </h3>
              <span className="text-xs text-gray-400 font-medium">{timelineEvents.length} events</span>
            </div>
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-5">
                {timelineEvents.map((ev, i) => {
                  if (ev.type === "payout") cumulativeEarned += ev.amount;
                  const isCapAdd = ev.type === "capital_add";
                  const isCapOut = ev.type === "capital_withdrawal";
                  const isPayout = ev.type === "payout";
                  const dotColor = isCapAdd ? "#05CE78" : isCapOut ? "#EF4444" : "#3B82F6";
                  const dotBg = isCapAdd ? "bg-[#05CE78]/15 border-[#05CE78]" : isCapOut ? "bg-red-50 border-red-400" : "bg-blue-50 border-blue-400";
                  return (
                    <div key={i} className="relative flex items-start gap-4 group">
                      <div className={`absolute -left-6 w-4 h-4 rounded-full border-2 flex items-center justify-center ${dotBg} shrink-0 mt-0.5`} style={{ zIndex: 1 }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {ev.label}
                              {ev.note && <span className="ml-1.5 text-xs font-medium text-gray-400">({ev.note})</span>}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{ev.dateStr}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold tabular-nums ${isCapAdd ? "text-[#05CE78]" : isCapOut ? "text-red-500" : "text-blue-600"}`}>
                              {isCapOut ? "- " : isCapAdd ? "+ " : ""}{formatCurrency(ev.amount)}
                            </p>
                            {isPayout && cumulativeEarned > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatCurrency(cumulativeEarned)} earned total
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        );
      })()}

      {/* 4. PAYOUT CHART */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-[#3B82F6]" />
          <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-900">Payout Chart</h3>
            </div>
            <p className="text-xs text-gray-400 font-medium">Last {chartData.length} distributions</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={(props: any) => {
                    const { x, y, payload } = props;
                    const dataPoint = chartData[payload.index];
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={16} textAnchor="middle" fill="#9CA3AF" fontSize={10} fontWeight="bold">
                          {payload.value}
                        </text>
                        {dataPoint?.monthNames && (
                          <text x={0} y={0} dy={28} textAnchor="middle" fill="#9CA3AF" fontSize={9}>
                            ({dataPoint.monthNames})
                          </text>
                        )}
                      </g>
                    );
                  }}
                />

                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(val) => `₹${val/1000}k`} />

                <Tooltip
                  cursor={{ fill: '#F9FAFB' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0B1120] text-white text-xs p-4 rounded-xl shadow-xl border border-gray-800 w-56">
                          <div className="border-b border-gray-700 pb-2 mb-2">
                            <p className="font-bold text-gray-200 text-sm">{label}</p>
                            {data.monthNames && <p className="text-gray-400 text-xs mt-0.5">{data.monthNames}</p>}
                            <p className="text-gray-500 text-xs mt-1">{data.fullDate}</p>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Gross IRR:</span>
                              <span className="font-medium text-gray-200">{formatCurrency(data.gross)}</span>
                            </div>

                            {data.emergency > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Emergency:</span>
                                <span className="font-medium text-orange-400">-{formatCurrency(data.emergency)}</span>
                              </div>
                            )}

                            {data.tds > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">TDS (10%):</span>
                                <span className="font-medium text-red-400">-{formatCurrency(data.tds)}</span>
                              </div>
                            )}

                            <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                              <span className="font-bold text-gray-200">Net Payout:</span>
                              <span className="font-bold text-[#05CE78] text-sm">{formatCurrency(data.amount)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#05CE78' : '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
        </div>
      )}

      {/* 5. PAYOUT HISTORY */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-[#6366F1]" />
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Coins className="w-4 h-4 text-indigo-500" /> Payout History
          </h3>
          <div className="flex items-center gap-2">
            <span className="sm:hidden text-xs text-gray-400 font-medium">← scroll →</span>
            {asset.annualizedReturns > 0 && (
              <span className="hidden sm:inline-flex text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 font-bold items-center gap-1">
                <Activity className="w-3 h-3" /> {asset.annualizedReturns.toFixed(2)}% IRR
              </span>
            )}
            <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200 font-bold shadow-sm">
              {asset.transactions.length} Records
            </span>
            {asset.transactions.length > 0 && (
              <button
                onClick={async () => {
                  if (isGeneratingPDF) return;
                  setIsGeneratingPDF(true);
                  try {
                    generateStatementPDF(asset, investorName);
                    await logEvent("INFO", "User downloaded asset statement PDF", { userId: authUserId, assetId: asset.id });
                  } catch {
                    alert("Failed to generate PDF. Please try again.");
                  } finally {
                    setIsGeneratingPDF(false);
                  }
                }}
                disabled={isGeneratingPDF}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </button>
            )}
            {asset.transactions.some(t => t.receipt_url) && (
              <button
                onClick={handleDownloadAllReceipts}
                disabled={zippingReceipts}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {zippingReceipts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                {zippingReceipts ? "Zipping..." : "Download Receipts (ZIP)"}
              </button>
            )}
          </div>
        </div>
        
        {asset.transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Payout Date</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">Emergency Fund</th>
                  {asset.lifetimeFDReturns > 0 && (
                    <th className="px-6 py-3 text-right">
                      <span className="inline-flex items-center gap-1">
                        FD Returns
                        <span
                          title="Interest earned on the emergency fund corpus kept in a fixed deposit on your behalf. Credited back to you each quarter alongside your payout. Only applicable when Hustlers Ventures has deployed your emergency fund reserve into an FD."
                          className="cursor-help"
                        >
                          <Info className="w-3 h-3 text-gray-400 opacity-70" />
                        </span>
                      </span>
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-red-400">TDS</th>
                  <th className="px-6 py-3 text-right font-bold text-gray-900">Net Payout</th>
                  <th className="px-6 py-3 text-right font-bold text-gray-900">Ann. IRR</th>
                  <th className="px-6 py-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {asset.transactions.slice((ledgerPage - 1) * LEDGER_PAGE_SIZE, ledgerPage * LEDGER_PAGE_SIZE).map((t) => (
                  <tr key={t.payment_id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-900">{t.payment_date}</td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                          {t.quarter}
                        </span>
                        {t.month_names && (
                          <span className="text-xs font-medium text-gray-500 ml-1">
                            ({t.month_names})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 tabular-nums">
                      {formatCurrency(t.gross_roi_amount)}
                    </td>
                    <td className="px-6 py-4 text-right text-orange-500 tabular-nums">
                      -{formatCurrency(t.emergency_fund)}
                    </td>
                    {asset.lifetimeFDReturns > 0 && (
                      <td className="px-6 py-4 text-right text-blue-500 tabular-nums">
                        +{formatCurrency(t.fd_returns)}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right text-red-400 tabular-nums text-xs">
                      -{formatCurrency(t.tds_amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#05CE78] tabular-nums text-base">
                      {formatCurrency(t.net_payable_amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-purple-600 tabular-nums">
                      {t.transaction_annualized_roi.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      {t.receipt_url ? (
                        <a
                          href={t.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Bank Receipt"
                          onClick={() => logEvent('INFO', 'User clicked to view payment receipt', { userId: authUserId, paymentId: t.payment_id }).catch(console.error)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs font-medium">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {asset.transactions.length > LEDGER_PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              Showing {Math.min((ledgerPage - 1) * LEDGER_PAGE_SIZE + 1, asset.transactions.length)}-{Math.min(ledgerPage * LEDGER_PAGE_SIZE, asset.transactions.length)} of {asset.transactions.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                disabled={ledgerPage === 1}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:border-[#05CE78] hover:text-[#05CE78] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.ceil(asset.transactions.length / LEDGER_PAGE_SIZE) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setLedgerPage(p)}
                  className={`w-8 h-8 text-xs font-bold rounded-lg border transition-colors ${p === ledgerPage ? 'bg-[#05CE78] text-white border-[#05CE78]' : 'border-gray-200 text-gray-500 hover:border-[#05CE78] hover:text-[#05CE78]'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setLedgerPage(p => Math.min(Math.ceil(asset.transactions.length / LEDGER_PAGE_SIZE), p + 1))}
                disabled={ledgerPage === Math.ceil(asset.transactions.length / LEDGER_PAGE_SIZE)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:border-[#05CE78] hover:text-[#05CE78] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. CAPITAL MOVEMENTS */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-slate-400" />
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-slate-400" /> Capital Movements
          </h3>
          <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200 font-bold shadow-sm">
            {capitalTransactions.length} Records
          </span>
        </div>

        {capitalTransactions.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No capital transactions recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Remarks</th>
                  <th className="px-6 py-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {capitalTransactions.map(t => (
                  <tr key={t.transaction_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {t.transaction_type === 'add' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                          <ArrowDownCircle className="w-3 h-3" /> Add
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                          <ArrowUpCircle className="w-3 h-3" /> Withdrawal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold tabular-nums text-gray-900">
                      {formatCurrency(t.investment_amount)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {t.remarks || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {t.receipt_url ? (
                        <a
                          href={t.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Receipt"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs font-medium">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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