export const EXAMPLE_PRINCIPAL = 1000000; // ₹10L
export const DEFAULT_ANNUAL_ROI_PERCENT = 6;
export const EXAMPLE_QUARTERS = 20; // 5 years
export const MIN_ROI_PERCENT = 6;
export const MAX_ROI_PERCENT = 100;

export function formatLakh(amount: number) {
  return `₹${(amount / 100000).toFixed(2)}L`;
}

// Matches the .onya-slider track fill defined in globals.css
export function sliderTrackStyle(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #05CE78 0%, #05CE78 ${pct}%, #b6b6b6 ${pct}%, #808080 100%)`,
  };
}

export interface XirrRow { quarter: number; base: number; payout: number; }
export interface CagrRow { quarter: number; base: number; payout: number; }

// XIRR: flat quarterly payout on original principal (principal never changes), principal returned at the end
export function buildXirrSchedule(principal: number, annualRoiPercent: number): XirrRow[] {
  const quarterlyRoi = annualRoiPercent / 100 / 4;
  return Array.from({ length: EXAMPLE_QUARTERS }, (_, i) => ({
    quarter: i + 1,
    base: principal,
    payout: principal * quarterlyRoi,
  }));
}

// CAGR: each quarter's payout compounds back into the base
export function buildCagrSchedule(principal: number, annualRoiPercent: number): CagrRow[] {
  const quarterlyRoi = annualRoiPercent / 100 / 4;
  const rows: CagrRow[] = [];
  let base = principal;
  for (let q = 1; q <= EXAMPLE_QUARTERS; q++) {
    const payout = base * quarterlyRoi;
    rows.push({ quarter: q, base, payout });
    base += payout;
  }
  return rows;
}

export function xirrTotals(schedule: XirrRow[], principal: number) {
  const totalPayouts = schedule.reduce((sum, r) => sum + r.payout, 0);
  return { totalPayouts, finalTotal: totalPayouts + principal };
}

export function cagrFinalTotal(schedule: CagrRow[]) {
  const last = schedule[schedule.length - 1];
  return last.base + last.payout;
}

export interface ProjectedRow { quarter: number; base: number; payout: number; isPast: boolean; }

// Blends real payouts already paid (fixed) with a projection for the remaining quarters
// up to EXAMPLE_QUARTERS, computed with the given ROI. XIRR keeps future payouts flat
// against the original principal; CAGR compounds future payouts starting from principal
// (past payouts were already paid out as cash, not reinvested, so they don't compound).
export function buildProjectedSchedule(
  principal: number,
  pastPayouts: number[],
  annualRoiPercent: number,
  returnType: "CAGR" | "XIRR"
): ProjectedRow[] {
  const quarterlyRoi = annualRoiPercent / 100 / 4;
  const totalQuarters = Math.max(EXAMPLE_QUARTERS, pastPayouts.length);
  const rows: ProjectedRow[] = [];
  let base = principal;

  for (let q = 1; q <= totalQuarters; q++) {
    if (q <= pastPayouts.length) {
      rows.push({ quarter: q, base: principal, payout: pastPayouts[q - 1], isPast: true });
      continue;
    }
    if (returnType === "CAGR") {
      const payout = base * quarterlyRoi;
      rows.push({ quarter: q, base, payout, isPast: false });
      base += payout;
    } else {
      rows.push({ quarter: q, base: principal, payout: principal * quarterlyRoi, isPast: false });
    }
  }
  return rows;
}

export function projectedTotals(rows: ProjectedRow[], principal: number) {
  const totalPayout = rows.reduce((sum, r) => sum + r.payout, 0);
  const finalTotal = totalPayout + principal;
  const percentEarned = (totalPayout / principal) * 100;
  return { totalPayout, finalTotal, percentEarned };
}

// Same AR Value formula used elsewhere in the app: (Gross ÷ Considered Amount) × (12 / monthsConsidered) × 100,
// per quarter (3 months considered), then averaged across all quarters — not a straight-line total/5.
// Correct for XIRR (flat, non-compounding payouts): resolves to exactly the nominal annual rate.
// NOT correct for CAGR: it only recovers the nominal per-quarter rate, understating the true effective
// annual growth rate that compounding actually produces — use effectiveAnnualRoiPercent for CAGR instead.
export function averageAnnualRoiPercent(rows: { base: number; payout: number }[]): number {
  const arValues = rows
    .filter(r => r.base > 0)
    .map(r => (r.payout / r.base) * 4 * 100);
  if (arValues.length === 0) return 0;
  return arValues.reduce((sum, v) => sum + v, 0) / arValues.length;
}

// True (geometric) effective annual rate: (Ending Value / Beginning Value)^(1/years) − 1.
// This is what "CAGR" means literally — the constant annual rate that, compounded over `years`,
// turns principal into finalTotal. A flat nominal-rate average (averageAnnualRoiPercent) understates
// this whenever compounding is involved, since quarterly compounding at a 24% nominal rate actually
// produces more than 24%/year of real growth.
export function effectiveAnnualRoiPercent(finalTotal: number, principal: number, years: number = 5): number {
  if (principal <= 0 || finalTotal <= 0) return 0;
  return (Math.pow(finalTotal / principal, 1 / years) - 1) * 100;
}

// Simple straight-line annualization: Total Payout ÷ Principal ÷ Years. Applied identically to both
// CAGR and XIRR so the two figures always use the same formula.
export function linearAnnualRoiPercent(totalPayout: number, principal: number, years: number = 5): number {
  if (principal <= 0 || years <= 0) return 0;
  return (totalPayout / (principal * years)) * 100;
}