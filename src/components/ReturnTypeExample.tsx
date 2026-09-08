"use client";

import { useMemo } from "react";
import {
  EXAMPLE_PRINCIPAL, DEFAULT_ANNUAL_ROI_PERCENT,
  buildXirrSchedule, buildCagrSchedule, xirrTotals, cagrFinalTotal,
  linearAnnualRoiPercent, formatLakh,
  type XirrRow, type CagrRow,
} from "@/lib/returnTypeExample";

const GRID_COLS = "grid-cols-[0.7fr_1.2fr_0.9fr_2px_0.9fr_0.9fr]";

interface CombinedRow {
  quarter: number;
  cagrBase: number;
  cagrPayout: number;
  cagrPrevBase: number | null;
  cagrPrevPayout: number | null;
  xirrBase: number;
  xirrPayout: number;
}

// Show the first 3 quarters, an ellipsis, and the final quarter — full 20-row schedule is overkill for an inline example.
function pickRows(rows: CombinedRow[], compact: boolean): (CombinedRow | "ellipsis")[] {
  if (!compact || rows.length <= 4) return rows;
  return [...rows.slice(0, 3), "ellipsis", rows[rows.length - 1]];
}

// cagrPrevBase/cagrPrevPayout are the previous quarter's base and payout — the two numbers that were
// added together to produce this quarter's own base — so investors can see exactly what principal
// their payout is computed on, instead of a forward-looking preview of next quarter's base.
function combineSchedules(cagrSchedule: CagrRow[], xirrSchedule: XirrRow[]): CombinedRow[] {
  return cagrSchedule.map((c, i) => ({
    quarter: c.quarter,
    cagrBase: c.base,
    cagrPayout: c.payout,
    cagrPrevBase: i > 0 ? cagrSchedule[i - 1].base : null,
    cagrPrevPayout: i > 0 ? cagrSchedule[i - 1].payout : null,
    xirrBase: xirrSchedule[i].base,
    xirrPayout: xirrSchedule[i].payout,
  }));
}

interface ReturnTypeExampleProps {
  principal?: number;
  annualRoiPercent?: number;
  compact?: boolean;
}

export default function ReturnTypeExample({ principal = EXAMPLE_PRINCIPAL, annualRoiPercent = DEFAULT_ANNUAL_ROI_PERCENT, compact = true }: ReturnTypeExampleProps) {
  const cagrSchedule = useMemo(() => buildCagrSchedule(principal, annualRoiPercent), [principal, annualRoiPercent]);
  const xirrSchedule = useMemo(() => buildXirrSchedule(principal, annualRoiPercent), [principal, annualRoiPercent]);
  const { totalPayouts: xirrTotalPayout } = useMemo(() => xirrTotals(xirrSchedule, principal), [xirrSchedule, principal]);
  const cagrFinal = useMemo(() => cagrFinalTotal(cagrSchedule), [cagrSchedule]);
  const combinedRows = useMemo(() => combineSchedules(cagrSchedule, xirrSchedule), [cagrSchedule, xirrSchedule]);
  const displayRows = useMemo(() => pickRows(combinedRows, compact), [combinedRows, compact]);

  const cagrTotalPayout = cagrFinal - principal;

  // Both CAGR and XIRR use the same straight-line formula: Total Payout ÷ Principal ÷ Years.
  const cagrAnnualRoi = useMemo(() => linearAnnualRoiPercent(cagrTotalPayout, principal), [cagrTotalPayout, principal]);
  const xirrAnnualRoi = useMemo(() => linearAnnualRoiPercent(xirrTotalPayout, principal), [xirrTotalPayout, principal]);

  return (
    <div className="max-w-[760px] mx-auto bg-blue-50 border border-blue-100 rounded-xl px-8 py-5">
      <div className="max-w-md mx-auto mb-4 bg-white/60 border border-blue-100 rounded-lg px-4 py-3">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 mb-2">
          <span />
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wide text-right">CAGR</span>
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wide text-right">XIRR</span>
        </div>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 items-center mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Payout (5 Years)</span>
          <span className="text-base font-black text-gray-900 text-right">{formatLakh(cagrTotalPayout)}</span>
          <span className="text-base font-black text-gray-900 text-right">{formatLakh(xirrTotalPayout)}</span>
        </div>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 items-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg. Annual ROI % (5 Years)</span>
          <span className="text-lg font-bold text-[#05CE78] text-right">{cagrAnnualRoi.toFixed(1)}%</span>
          <span className="text-lg font-bold text-[#05CE78] text-right">{xirrAnnualRoi.toFixed(1)}%</span>
        </div>
      </div>

      <div className="w-full max-w-[760px] mx-auto bg-white/60 border border-blue-100 rounded-xl overflow-x-auto">
        <div className="min-w-[600px]">
          <div className={`grid ${GRID_COLS} px-5 py-4 bg-blue-100/80 text-sm font-bold text-blue-900 tracking-wide`}>
            <span className="text-left">Quarter</span>
            <span className="text-right">CAGR Principal</span>
            <span className="text-right pr-3">CAGR Payout</span>
            <span className="self-stretch bg-blue-900/50" />
            <span className="text-right pl-3">XIRR Principal</span>
            <span className="text-right">XIRR Payout</span>
          </div>

          <div className="divide-y divide-solid divide-blue-200 text-base font-medium text-blue-800">
            {displayRows.map((row, i) => row === "ellipsis" ? (
              <div key={`ellipsis-${i}`} className="py-4 text-center text-blue-400">⋮</div>
            ) : (
              <div key={row.quarter} className={`grid ${GRID_COLS} px-5 py-4 items-stretch`}>
                <span className="font-semibold self-center">Q{row.quarter}</span>
                <span className="text-right self-center">
                  {row.cagrPrevBase == null
                    ? formatLakh(row.cagrBase)
                    : <>{formatLakh(row.cagrPrevBase)} <span className="text-gray-400">+</span> {formatLakh(row.cagrPrevPayout!)}</>}
                </span>
                <span className="text-right font-semibold text-[#05CE78] self-center pr-3">{formatLakh(row.cagrPayout)}</span>
                <span className="self-stretch bg-blue-300" />
                <span className="text-right self-center pl-3">{formatLakh(row.xirrBase)}</span>
                <span className="text-right self-center">{formatLakh(row.xirrPayout)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
