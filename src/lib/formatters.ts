export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

// Compact format for cards and public pages: ₹2Cr, ₹50L, ₹75K
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, "")}Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1).replace(/\.0$/, "")}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export type AssetSector = "transportation" | "hospitality" | "fnb" | "debt" | "portfolio";

export function getAssetSector(name: string | null | undefined): AssetSector {
  const n = (name || "").toLowerCase();
  if (n.includes("zostel") || n.includes("hostel")) return "hospitality";
  if (n.includes("restaurant") || n.includes("jadcherla") || n.includes("fnb")) return "fnb";
  if (n.includes("debt") || n.includes("fixed income") || n.includes("bond")) return "debt";
  if (n.includes("alpha") || n.includes("portfolio")) return "portfolio";
  // Default: transportation (bus pools)
  return "transportation";
}

export function isTransportationAsset(name: string | null | undefined): boolean {
  return getAssetSector(name) === "transportation";
}

export type DebtTerms = {
  fixed_roi_percentage?: number;
  term_months?: number;
  payment_cycle?: string;
  loan_start_date?: string;
} | null | undefined;

const PAYMENT_CYCLE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half-Yearly",
  annual: "Annual",
};

// Formats investor_investments.debt_terms into a single display string, e.g. "16% p.a. · 12mo · Annual"
export function formatLoanTerms(debtTerms: DebtTerms): string {
  if (!debtTerms) return "-";
  const parts: string[] = [];
  if (debtTerms.fixed_roi_percentage != null) parts.push(`${debtTerms.fixed_roi_percentage}% p.a.`);
  if (debtTerms.term_months != null) parts.push(`${debtTerms.term_months}mo`);
  if (debtTerms.payment_cycle) parts.push(PAYMENT_CYCLE_LABELS[debtTerms.payment_cycle] ?? debtTerms.payment_cycle);
  return parts.length > 0 ? parts.join(" · ") : "-";
}
