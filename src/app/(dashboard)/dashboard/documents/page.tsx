"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/logger";
import { formatCurrency } from "@/lib/formatters";
import {
  FileText, Download, Search, Loader2, FolderOpen,
  Receipt, Building2, ShieldCheck, FilterX, Archive, BarChart2,
  FileArchive,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";

function getIndianFY(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth();
  const year = d.getFullYear();
  const fyStart = month >= 3 ? year : year - 1;
  return `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`;
}

function generateTaxSummaryPDF(
  taxRows: { fy: string; gross: number; tds: number; ef: number; net: number; count: number }[],
  investorName: string | null
) {
  const doc = new jsPDF();
  const safeFormatIN = (val: number) => {
    const s = Math.round(val).toString();
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    return (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "") + last3;
  };
  const fmt = (val: number) => `Rs. ${safeFormatIN(val)}`;

  doc.setFontSize(24); doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30); doc.text("HUSTLERS", 14, 22);
  doc.setTextColor(5, 206, 120); doc.text("VENTURES", 14, 30);
  doc.setFontSize(16); doc.setTextColor(30, 30, 30);
  doc.text("Tax Summary: ITR Reference", 196, 22, { align: "right" });
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}`, 196, 30, { align: "right" });
  doc.setDrawColor(230, 230, 230); doc.line(14, 38, 196, 38);

  let currentY = 46;
  if (investorName) {
    autoTable(doc, {
      startY: currentY,
      head: [["Investor", ""]],
      body: [["Name", investorName]],
      theme: "grid",
      headStyles: { fillColor: [5, 206, 120], textColor: 255, fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 5, textColor: [40, 40, 40] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  doc.setFontSize(9); doc.setTextColor(130, 130, 130);
  doc.text("Income from securitised debt instruments. TDS under Sec 194LBC. Share with your CA for ITR filing.", 14, currentY);
  currentY += 12;

  autoTable(doc, {
    startY: currentY,
    head: [["Financial Year", "Gross Income", "Emergency Fund", "TDS Deducted", "Net Received", "Payouts"]],
    body: taxRows.map(t => [t.fy, fmt(t.gross), `- ${fmt(t.ef)}`, `- ${fmt(t.tds)}`, fmt(t.net), `${t.count}`]),
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  const totals = taxRows.reduce((a, t) => ({ gross: a.gross + t.gross, ef: a.ef + t.ef, tds: a.tds + t.tds, net: a.net + t.net }), { gross: 0, ef: 0, tds: 0, net: 0 });
  autoTable(doc, {
    startY: currentY,
    head: [["All-time Summary", "Amount"]],
    body: [
      ["Total Gross Income", fmt(totals.gross)],
      ["Total Emergency Fund", `- ${fmt(totals.ef)}`],
      ["Total TDS Deducted", `- ${fmt(totals.tds)}`],
      ["Total Net Received", fmt(totals.net)],
    ],
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5, textColor: [40, 40, 40] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
  });

  doc.save(`Tax-Summary-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// --- STATEMENT PDF GENERATOR ---
function generateStatementPDF(
  assetName: string,
  investedAmount: number,
  payouts: { payment_date: string; quarter: string; month_names: string | null; gross: number; emergency: number; tds: number; net: number; irr: number; months: number }[],
  investorName: string | null,
) {
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
  doc.text(`Asset Statement: ${assetName}`, 196, 22, { align: "right" });
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}`, 196, 30, { align: "right" });
  doc.setDrawColor(230, 230, 230); doc.line(14, 38, 196, 38);

  const lifetimeNet = payouts.reduce((s, p) => s + p.net, 0);
  const lifetimeEmergency = payouts.reduce((s, p) => s + p.emergency, 0);
  const lifetimeTds = payouts.reduce((s, p) => s + p.tds, 0);
  const totalMonths = payouts.reduce((s, p) => s + p.months, 0);
  const weightedNumerator = investedAmount > 0
    ? payouts.reduce((s, p) => s + (p.gross / investedAmount) * 12, 0)
    : 0;
  const annIrr = totalMonths > 0 && weightedNumerator > 0
    ? (weightedNumerator / totalMonths) * 100
    : 0;

  autoTable(doc, {
    startY: 46,
    head: [["Investor", "Invested Amount", "Total Net Payout", "Emergency Fund", "TDS Deducted", "Annualised IRR"]],
    body: [[investorName ?? "—", fmt(investedAmount), fmt(lifetimeNet), `- ${fmt(lifetimeEmergency)}`, `- ${fmt(lifetimeTds)}`, `${annIrr.toFixed(2)}%`]],
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 10, fontStyle: "bold", textColor: [11, 17, 32], cellPadding: 6 },
  });

  const currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    head: [["Payout Date", "Period", "Gross", "Emergency", "TDS", "Net Payout", "IRR %"]],
    body: payouts.length > 0
      ? payouts.map(p => [
          new Date(p.payment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          p.month_names ? `${p.quarter} (${p.month_names})` : p.quarter,
          safeFormatIN(p.gross), `-${safeFormatIN(p.emergency)}`, `-${safeFormatIN(p.tds)}`,
          safeFormatIN(p.net), `${p.irr.toFixed(2)}%`,
        ])
      : [["No payouts yet", "", "", "", "", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [5, 206, 120], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 4, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  doc.save(`${assetName.replace(/\s+/g, "-")}-Statement-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// --- TYPE DEFINITIONS ---
interface InvestmentSummary {
  investment_id: string;
  assetName: string;
  total_amount: number;
  created_at: string;
  status: string;
}

interface VirtualDocument {
  id: string;
  name: string;
  typeLabel: string; 
  category: 'agreement' | 'payout' | 'tax'; 
  url: string;
  date: string;
  year: number; 
  assetName?: string;
  source_table: 'investments' | 'payments' | 'documents';
}

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterId = searchParams.get('filter'); 

  const [loading, setLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<VirtualDocument[]>([]);
  const [taxRows, setTaxRows] = useState<{ fy: string; gross: number; tds: number; ef: number; net: number; count: number }[]>([]);
  const [investorName, setInvestorName] = useState<string | null>(null);
  const [isGeneratingTaxPDF, setIsGeneratingTaxPDF] = useState(false);
  const [investments, setInvestments] = useState<InvestmentSummary[]>([]);
  const [generatingStatementId, setGeneratingStatementId] = useState<string | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [zippingReceipts, setZippingReceipts] = useState(false);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    async function fetchDocs() {
      let currentUserId: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        currentUserId = user.id;
        setAuthUserId(user.id);

        // A login can map to more than one investor profile (e.g. a shared family/associate
        // login) — fetch all matches rather than .single(), which errors on >1 row.
        const { data: invProfiles } = await supabase
          .from("investors")
          .select("investor_name")
          .eq("user_id", user.id);
        if (invProfiles && invProfiles.length > 0) setInvestorName(invProfiles.map(p => p.investor_name.trim()).join(" & "));

        const docsAccumulator: VirtualDocument[] = [];

        // A. AGREEMENTS
        let agreementQuery = supabase
          .from('investor_investments')
          .select('investment_id, agreement_url, created_at, company_name, company_pools(pool_name)')
          .eq('user_id', user.id)
          .not('agreement_url', 'is', null);

        if (filterId) agreementQuery = agreementQuery.eq('investment_id', filterId);
        const { data: agreements, error: agreeError } = await agreementQuery;

        if (agreeError) throw agreeError;

        if (agreements) {
          agreements.forEach((item: any) => {
            const assetName = item.company_name || item.company_pools?.pool_name || "Asset";
            docsAccumulator.push({
              id: `agree-${item.investment_id}`,
              name: `${assetName} - Investment Agreement`,
              typeLabel: 'Agreement',
              category: 'agreement', 
              url: item.agreement_url,
              date: item.created_at,
              year: new Date(item.created_at).getFullYear(),
              assetName: assetName,
              source_table: 'investments'
            });
          });
        }

        // B. PAYOUTS
        const { data: userInv, error: userInvError } = await supabase
          .from('investor_investments')
          .select('investment_id, company_name, total_amount, created_at, company_pools(pool_name, status)')
          .eq('user_id', user.id);
          
        if (userInvError) throw userInvError;
          
        const invIds = userInv?.map(i => i.investment_id) || [];

        if (userInv) {
          setInvestments(userInv.map((inv: any) => ({
            investment_id: inv.investment_id,
            assetName: inv.company_pools?.pool_name || "Asset",
            total_amount: Number(inv.total_amount),
            created_at: inv.created_at,
            status: inv.company_pools?.status || "Active",
          })));
        }

        if (invIds.length > 0) {
          // Fetch all payments for tax summary (no receipt_url filter)
          const { data: allPayments } = await supabase
            .from("investor_quarterly_payments")
            .select("payment_date, gross_roi_amount, net_payable_amount, emergency_fund_deduction, tds_deduction")
            .in("investment_id", invIds)
            .not("payment_date", "is", null);

          if (allPayments && allPayments.length > 0) {
            const byFY: Record<string, { fy: string; gross: number; tds: number; ef: number; net: number; count: number }> = {};
            allPayments.forEach((p: any) => {
              const fy = getIndianFY(p.payment_date);
              if (!byFY[fy]) byFY[fy] = { fy, gross: 0, tds: 0, ef: 0, net: 0, count: 0 };
              byFY[fy].gross += Number(p.gross_roi_amount || 0);
              byFY[fy].tds += Number(p.tds_deduction || 0);
              byFY[fy].ef += Number(p.emergency_fund_deduction || 0);
              byFY[fy].net += Number(p.net_payable_amount || 0);
              byFY[fy].count += 1;
            });
            setTaxRows(Object.values(byFY).sort((a, b) => b.fy.localeCompare(a.fy)));
          }

          let paymentQuery = supabase
            .from('investor_quarterly_payments')
            .select('payment_id, receipt_url, payment_date, created_at, investment_id, quarterly_roi_declarations(quarter_year, month_names), company_name')
            .in('investment_id', invIds)
            .not('receipt_url', 'is', null);

          if (filterId) paymentQuery = paymentQuery.eq('investment_id', filterId);
          const { data: payments, error: payError } = await paymentQuery;
          
          if (payError) throw payError;

          if (payments) {
            const formatAmountShort = (num: number) => {
              if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
              if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
              if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
              return num.toString();
            };

            payments.forEach((pay: any) => {
              const quarter = pay.quarterly_roi_declarations?.quarter_year || "Distribution";
              const monthNames = pay.quarterly_roi_declarations?.month_names || null;
              
              const periodString = monthNames ? `${quarter} (${monthNames})` : quarter;

              const matchingInvestment = userInv?.find(inv => inv.investment_id === pay.investment_id);

              const poolData: any = matchingInvestment?.company_pools;
              const poolName = Array.isArray(poolData) ? poolData[0]?.pool_name : poolData?.pool_name;
              const companyName = pay.company_name || poolName || "Asset";

              const investedAmount = Number(matchingInvestment?.total_amount || 0);
              const investedStr = investedAmount > 0 ? `₹${formatAmountShort(investedAmount)} Inv.` : '';
              const invDateObj = new Date(matchingInvestment?.created_at || pay.created_at);
              const invDateStr = invDateObj.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
              
              const receiptName = `${periodString} - ${companyName} Receipt ${investedStr ? `(${investedStr} - ${invDateStr})` : ''}`.trim();

              const dateStr = pay.payment_date || pay.created_at;

              docsAccumulator.push({
                id: `pay-${pay.payment_id}`,
                name: receiptName,
                typeLabel: 'Bank Receipt',
                category: 'payout', 
                url: pay.receipt_url,
                date: dateStr,
                year: new Date(dateStr).getFullYear(),
                assetName: companyName,
                source_table: 'payments'
              });
            });
          }
        }

        docsAccumulator.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDocuments(docsAccumulator);

        await logEvent('INFO', 'User loaded document vault', { 
          userId: currentUserId,
          documentCount: docsAccumulator.length 
        });

      } catch (err: any) {
        console.error("Error loading documents:", err);
        await logEvent('ERROR', 'Failed to load document vault', { 
          userId: currentUserId,
          errorDetails: err.message || err 
        });
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, [filterId]);

  // --- 2. DOWNLOAD HANDLER ---
  const handleDownload = async (doc: VirtualDocument) => {
    try {
      setDownloadingId(doc.id);
      
      const { data: { user } } = await supabase.auth.getUser();

      if (doc.url.startsWith('http')) {
        await logEvent('INFO', 'User downloaded document (External Link)', { 
          userId: user?.id,
          documentId: doc.id,
          documentName: doc.name,
          category: doc.category
        });
        
        window.open(doc.url, '_blank');
        return;
      }
      
      let bucketName = 'documents'; 
      if (doc.source_table === 'investments') bucketName = 'agreements';
      if (doc.source_table === 'payments') bucketName = 'receipts';
      if (doc.source_table === 'documents') bucketName = 'investor_docs'; 

      const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(doc.url, 60);
      if (error) throw error;
      
      if (data?.signedUrl) {
        await logEvent('INFO', 'User downloaded document (Storage)', { 
          userId: user?.id,
          documentId: doc.id,
          documentName: doc.name,
          bucket: bucketName
        });

        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      await logEvent('ERROR', 'Failed to generate document download link', {
        userId: authUserId,
        documentId: doc.id,
        documentName: doc.name,
        errorDetails: err.message || err
      });

      alert("Could not download file.");
    } finally {
      setDownloadingId(null);
    }
  };

  // --- 2b. DOWNLOAD ALL PAYOUT RECEIPTS AS ZIP ---
  // Receipts are a mix of Google Drive share links, direct files, and storage paths — resolving
  // them requires server-side access (Drive API + no browser CORS restriction), so this just
  // calls the API route and streams back the finished ZIP.
  const handleDownloadAllReceipts = async () => {
    if (zippingReceipts) return;
    setZippingReceipts(true);
    try {
      const res = await fetch('/api/dashboard/receipts/zip');
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
      a.download = `Payout-Receipts-${new Date().toISOString().slice(0, 10)}.zip`;
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

  // --- 3. STATEMENT GENERATOR ---
  const handleGenerateStatement = async (inv: InvestmentSummary) => {
    setGeneratingStatementId(inv.investment_id);
    try {
      const { data: payouts } = await supabase
        .from("investor_quarterly_payments")
        .select("payment_date, gross_roi_amount, net_payable_amount, emergency_fund_deduction, tds_deduction, months_considered, quarterly_roi_declarations(quarter_year, month_names)")
        .eq("investment_id", inv.investment_id)
        .order("payment_date", { ascending: true });

      const mapped = (payouts ?? []).map((p: any) => {
        const months = Math.max(Number(p.months_considered) || 3, 1);
        return {
          payment_date: p.payment_date,
          quarter: p.quarterly_roi_declarations?.quarter_year ?? "—",
          month_names: p.quarterly_roi_declarations?.month_names ?? null,
          gross: Number(p.gross_roi_amount),
          emergency: Number(p.emergency_fund_deduction),
          tds: Number(p.tds_deduction),
          net: Number(p.net_payable_amount),
          months,
          irr: inv.total_amount > 0
            ? (Number(p.gross_roi_amount) / inv.total_amount) * (12 / months) * 100
            : 0,
        };
      });

      generateStatementPDF(inv.assetName, inv.total_amount, mapped, investorName);
      await logEvent("INFO", "User generated asset statement PDF", { userId: authUserId, investmentId: inv.investment_id });
    } catch {
      alert("Failed to generate statement. Please try again.");
    } finally {
      setGeneratingStatementId(null);
    }
  };

  // --- 4. UI LOGIC ---
  const contextAssetName = useMemo(() => {
    if (!filterId || documents.length === 0) return null;
    return documents[0].assetName || "Selected Asset";
  }, [filterId, documents]);

  const groupedDocs = useMemo(() => {
    const filtered = documents.filter(doc => {
      const matchesTab = activeTab === "all" || doc.category === activeTab;
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });

    const groups: Record<number, VirtualDocument[]> = {};
    filtered.forEach(doc => {
      if (!groups[doc.year]) groups[doc.year] = [];
      groups[doc.year].push(doc);
    });

    return Object.entries(groups)
      .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
      .map(([year, docs]) => ({ year, docs }));
  }, [documents, activeTab, searchQuery]);

  const isNew = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    return diff < (1000 * 60 * 60 * 24 * 30); 
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'agreement': return <ShieldCheck className="w-5 h-5" />;
      case 'payout': return <Receipt className="w-5 h-5" />;
      case 'tax': return <Building2 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'agreement': return 'bg-blue-50 text-blue-600 border-blue-100'; 
      case 'payout': return 'bg-emerald-50 text-emerald-600 border-emerald-100'; 
      case 'tax': return 'bg-amber-50 text-amber-600 border-amber-100'; 
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const tabs = [
    { id: "all", label: "All Files" },
    { id: "agreement", label: "Agreements" },
    { id: "payout", label: "Payouts" },
    { id: "tax", label: "Tax Docs" },
    { id: "statement", label: "Statements" },
  ];

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="h-48 rounded-2xl bg-gray-200 animate-pulse" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-12">
      
      {/* 1. DARK VAULT HEADER */}
      <div className="bg-[#0B1120] rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[900px] h-[500px] bg-[#05CE78]/10 blur-[120px] rounded-full" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          <div className="absolute w-[400px] h-[200px] bg-[#05CE78]/8 blur-[80px] rounded-full" style={{ top: "33%", left: "50%", transform: "translate(-50%, -50%)" }} />
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-white">
          <Archive className="w-64 h-64" />
        </div>

        <div className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 min-h-[24px]">
                {filterId ? (
                  <>
                    <button 
                      onClick={() => router.push('/dashboard/documents')}
                      className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <FilterX className="w-3 h-3" /> Clear Filter
                    </button>
                    <span className="text-gray-600 text-xs">|</span>
                    <span className="bg-[#05CE78]/10 text-[#05CE78] px-2 py-0.5 rounded text-xs font-bold border border-[#05CE78]/20 flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" /> {contextAssetName}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Secure Document Storage
                  </span>
                )}
              </div>

              <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                Documents Vault
              </h2>
              <p className="text-gray-400 mt-2 text-sm max-w-lg">
                Access your investment agreements, quarterly payout receipts, and tax statements securely in one place.
              </p>
            </div>
            
            <div className="relative w-full md:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#05CE78] transition-colors" />
              <input 
                type="text" 
                placeholder="Search by name, year..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#05CE78] transition-all"
              />
            </div>
          </div>

          <div className="flex gap-1 mt-8 border-t border-white/10 pt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-[#05CE78] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAX SUMMARY — shown when Tax Docs tab is active */}
      {activeTab === "tax" && taxRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" /> Tax Summary
              </h3>
              <p className="text-xs text-gray-500 mt-1">Financial year-wise income &amp; deductions (Indian FY: Apr–Mar)</p>
            </div>
            <button
              onClick={async () => {
                if (isGeneratingTaxPDF) return;
                setIsGeneratingTaxPDF(true);
                try {
                  generateTaxSummaryPDF(taxRows, investorName);
                  await logEvent("INFO", "User generated Tax Summary PDF", { userId: authUserId, fyCount: taxRows.length });
                } catch {
                  alert("Failed to generate PDF. Please try again.");
                } finally {
                  setIsGeneratingTaxPDF(false);
                }
              }}
              disabled={isGeneratingTaxPDF}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isGeneratingTaxPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {isGeneratingTaxPDF ? "Generating..." : "ITR Summary PDF"}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {taxRows.map(t => (
              <div key={t.fy} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-900">{t.fy}</span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    {t.count} payout{t.count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Gross Income</span>
                    <span className="font-bold text-gray-900">{formatCurrency(t.gross)}</span>
                  </div>
                  {t.ef > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Emergency Fund</span>
                      <span className="font-medium text-amber-600">- {formatCurrency(t.ef)}</span>
                    </div>
                  )}
                  {t.tds > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">TDS (Sec 194LBC)</span>
                      <span className="font-medium text-red-500">- {formatCurrency(t.tds)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold border-t border-gray-100 pt-2 mt-1">
                    <span className="text-gray-700">Net Received</span>
                    <span className="text-[#05CE78]">{formatCurrency(t.net)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAYOUT RECEIPTS — download-all-as-ZIP, shown when Payouts tab is active */}
      {activeTab === "payout" && documents.filter(d => d.category === 'payout').length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <FileArchive className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {documents.filter(d => d.category === 'payout').length} payout receipt{documents.filter(d => d.category === 'payout').length !== 1 ? "s" : ""} available
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {zippingReceipts
                  ? "Fetching your receipts…"
                  : "Download every payout receipt in one ZIP file."}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadAllReceipts}
            disabled={zippingReceipts}
            className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {zippingReceipts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
            {zippingReceipts ? "Zipping..." : "Download All as ZIP"}
          </button>
        </div>
      )}

      {/* STATEMENTS TAB — one card per investment */}
      {activeTab === "statement" && (
        <div className="space-y-4">
          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
              <BarChart2 className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-semibold text-gray-500">No investments found</p>
              <p className="text-xs text-gray-400 mt-1">Statements will appear here once you have active investments.</p>
            </div>
          ) : (
            investments.map(inv => (
              <div key={inv.investment_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{inv.assetName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${inv.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
                        {inv.status}
                      </span>
                      <span className="text-xs text-gray-400">{formatCurrency(inv.total_amount)} invested</span>
                      <span className="text-xs text-gray-400">· Since {new Date(inv.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleGenerateStatement(inv)}
                  disabled={generatingStatementId === inv.investment_id}
                  className="flex items-center gap-2 text-xs font-bold bg-[#05CE78] hover:bg-[#04b86c] text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {generatingStatementId === inv.investment_id
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                    : <><Download className="w-3.5 h-3.5" /> Generate Statement</>}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. GROUPED LIST */}
      {activeTab !== "statement" && <div className="space-y-8">
        {groupedDocs.length > 0 ? (
          groupedDocs.map(({ year, docs }) => (
            <div key={year} className="animate-in slide-in-from-bottom-2 duration-500">
              
              <div className="flex items-center gap-4 mb-4">
                 <h3 className="text-lg font-bold text-gray-400">{year}</h3>
                 <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                {docs.map((doc) => (
                  <div key={doc.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group relative overflow-hidden">
                    
                    {isNew(doc.date) && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#05CE78]"></div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${getCategoryColor(doc.category)}`}>
                        {getCategoryIcon(doc.category)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#05CE78] transition-colors line-clamp-1">
                            {doc.name}
                          </h4>
                          {isNew(doc.date) && (
                            <span className="text-xs bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded border border-red-100">NEW</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="font-medium">
                            {new Date(doc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="uppercase font-bold tracking-wider text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                            {doc.typeLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDownload(doc)}
                      disabled={!!downloadingId}
                      className="p-2.5 text-gray-400 hover:text-[#05CE78] hover:bg-green-50 rounded-lg transition-all border border-transparent hover:border-green-100 ml-4 flex-shrink-0"
                      title="Download File"
                    >
                      {downloadingId === doc.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
            {documents.length === 0 ? (
              <>
                <p className="text-sm font-semibold text-gray-500">No documents yet</p>
                <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">
                  Once you invest, your agreements, payout statements, and tax documents will appear here.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">No documents found.</p>
                {activeTab !== 'all' && (
                  <button
                    onClick={() => setActiveTab('all')}
                    className="mt-4 text-[#05CE78] text-xs font-bold hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>}

    </div>
  );
}