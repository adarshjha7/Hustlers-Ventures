"use client";

import { useMemo, useState } from "react";
import {
  MIN_ROI_PERCENT, MAX_ROI_PERCENT, DEFAULT_ANNUAL_ROI_PERCENT,
  buildProjectedSchedule, projectedTotals, linearAnnualRoiPercent, formatLakh, sliderTrackStyle,
  type ProjectedRow,
} from "@/lib/returnTypeExample";

// Past quarters already paid are shown as-is (fixed, real cash — identical regardless of CAGR/XIRR,
// since that money was already paid out under whichever type was active at the time).
// Future quarters are a projection driven by the ROI slider, and diverge by type: CAGR compounds
// its payout back into the base, XIRR stays flat against the original principal.
type DisplayRow =
  | { type: "row"; quarter: number; isPast: boolean; isNextQuarter: boolean; roiPercent: number | null; cagrBase: number; cagrPayout: number; cagrPrevBase: number | null; cagrPrevPayout: number | null; xirrBase: number; xirrPayout: number }
  | { type: "collapsed"; fromQuarter: number; toQuarter: number; totalPayout: number; principal: number }
  | { type: "ellipsis" };

const GRID_COLS = "grid-cols-[0.7fr_1.2fr_0.9fr_2px_0.9fr_0.9fr]";

function buildDisplayRows(cagrSchedule: ProjectedRow[], xirrSchedule: ProjectedRow[], principal: number, compact: boolean): DisplayRow[] {
  const pastIdx = cagrSchedule.reduce((count, r) => r.isPast ? count + 1 : count, 0);
  const past = cagrSchedule.slice(0, pastIdx);
  const cagrFuture = cagrSchedule.slice(pastIdx);
  const xirrFuture = xirrSchedule.slice(pastIdx);

  const pastRows: DisplayRow[] = compact && past.length > 0
    ? [{
        type: "collapsed",
        fromQuarter: past[0].quarter,
        toQuarter: past[past.length - 1].quarter,
        totalPayout: past.reduce((sum, r) => sum + r.payout, 0),
        principal,
      }]
    : past.map(r => ({
        type: "row" as const,
        quarter: r.quarter,
        isPast: true,
        isNextQuarter: false,
        roiPercent: principal > 0 ? (r.payout * 400) / principal : null,
        cagrBase: r.base,
        cagrPayout: r.payout,
        cagrPrevBase: null,
        cagrPrevPayout: null,
        xirrBase: r.base,
        xirrPayout: r.payout,
      }));

  // For rows after the immediate next quarter, show the split as "prior base + prior payout" —
  // the two numbers that were added together to produce this row's own base — so investors can see
  // exactly what principal their payout is computed on, instead of a forward-looking preview.
  const toFutureRow = (i: number, isNextQuarter: boolean): DisplayRow => ({
    type: "row",
    quarter: cagrFuture[i].quarter,
    isPast: false,
    isNextQuarter,
    roiPercent: null,
    cagrBase: cagrFuture[i].base,
    cagrPayout: cagrFuture[i].payout,
    cagrPrevBase: i > 0 ? cagrFuture[i - 1].base : null,
    cagrPrevPayout: i > 0 ? cagrFuture[i - 1].payout : null,
    xirrBase: xirrFuture[i].base,
    xirrPayout: xirrFuture[i].payout,
  });

  const futureRows: DisplayRow[] = !compact || cagrFuture.length <= 4
    ? cagrFuture.map((_, i) => toFutureRow(i, i === 0))
    : [...cagrFuture.slice(0, 3).map((_, i) => toFutureRow(i, i === 0)), { type: "ellipsis" }, toFutureRow(cagrFuture.length - 1, false)];

  return [...pastRows, ...futureRows];
}

interface PersonalizedReturnExampleProps {
  principal: number;
  pastPayouts: number[];
  lastDeclaredRoiPercent?: number | null;
  compact?: boolean;
}

// Defaults the ROI slider to the actual declared rate for the investor's last paid quarter, so the
// projection starts from where their real returns left off rather than a generic assumption.
function initialRoiPercent(lastDeclaredRoiPercent: number | null | undefined): number {
  if (!lastDeclaredRoiPercent) return DEFAULT_ANNUAL_ROI_PERCENT;
  return Math.min(MAX_ROI_PERCENT, Math.max(MIN_ROI_PERCENT, Math.round(lastDeclaredRoiPercent)));
}

export default function PersonalizedReturnExample({ principal, pastPayouts, lastDeclaredRoiPercent, compact = true }: PersonalizedReturnExampleProps) {
  const [roiPercent, setRoiPercent] = useState(() => initialRoiPercent(lastDeclaredRoiPercent));

  const cagrSchedule = useMemo(
    () => buildProjectedSchedule(principal, pastPayouts, roiPercent, "CAGR"),
    [principal, pastPayouts, roiPercent]
  );
  const xirrSchedule = useMemo(
    () => buildProjectedSchedule(principal, pastPayouts, roiPercent, "XIRR"),
    [principal, pastPayouts, roiPercent]
  );
  const displayRows = useMemo(
    () => buildDisplayRows(cagrSchedule, xirrSchedule, principal, compact),
    [cagrSchedule, xirrSchedule, principal, compact]
  );
  const { totalPayout: cagrTotalPayout } = useMemo(() => projectedTotals(cagrSchedule, principal), [cagrSchedule, principal]);
  const { totalPayout: xirrTotalPayout } = useMemo(() => projectedTotals(xirrSchedule, principal), [xirrSchedule, principal]);

  // "Avg. Annual ROI %" reflects the projected future rate (what the slider controls), not a blend
  // with real past history, and uses the same straight-line formula (Total ÷ Principal ÷ Years) for
  // both CAGR and XIRR.
  const pastCount = pastPayouts.length;
  const cagrFutureRows = useMemo(() => cagrSchedule.slice(pastCount), [cagrSchedule, pastCount]);
  const xirrFutureRows = useMemo(() => xirrSchedule.slice(pastCount), [xirrSchedule, pastCount]);
  const futureYears = cagrFutureRows.length / 4;
  const cagrFutureTotalPayout = useMemo(() => cagrFutureRows.reduce((sum, r) => sum + r.payout, 0), [cagrFutureRows]);
  const xirrFutureTotalPayout = useMemo(() => xirrFutureRows.reduce((sum, r) => sum + r.payout, 0), [xirrFutureRows]);
  const cagrAnnualRoi = useMemo(
    () => linearAnnualRoiPercent(cagrFutureTotalPayout, principal, futureYears),
    [cagrFutureTotalPayout, principal, futureYears]
  );
  const xirrAnnualRoi = useMemo(
    () => linearAnnualRoiPercent(xirrFutureTotalPayout, principal, futureYears),
    [xirrFutureTotalPayout, principal, futureYears]
  );

  return (
    <>
      <div className="max-w-sm mx-auto mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Your Investment</span>
          <span className="text-base font-black text-gray-900">{formatLakh(principal)}</span>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Return % (future quarters)</span>
          <span className="text-base font-black text-[#05CE78]">{roiPercent}%</span>
        </div>
        <input
          type="range"
          min={MIN_ROI_PERCENT}
          max={MAX_ROI_PERCENT}
          step={1}
          value={roiPercent}
          onChange={e => setRoiPercent(Number(e.target.value))}
          className="onya-slider"
          style={sliderTrackStyle(roiPercent, MIN_ROI_PERCENT, MAX_ROI_PERCENT)}
        />
        <div className="flex justify-between text-sm text-gray-400 mt-1">
          <span>{MIN_ROI_PERCENT}%</span>
          <span>{MAX_ROI_PERCENT}%</span>
        </div>
      </div>

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
              {displayRows.map((row, i) => {
                if (row.type === "ellipsis") {
                  return (
                    <div key={`ellipsis-${i}`} className="py-3 text-center text-blue-400">⋮</div>
                  );
                }
                if (row.type === "collapsed") {
                  return (
                    <div key="collapsed-past" className={`grid ${GRID_COLS} px-5 py-4 items-stretch bg-blue-50/60`}>
                      <span className="font-semibold truncate self-center">
                        Q{row.fromQuarter}–Q{row.toQuarter} <span className="text-xs font-bold text-gray-400 normal-case">(Paid)</span>
                      </span>
                      <span className="text-right self-center">{formatLakh(row.principal)}</span>
                      <span className="text-right font-semibold self-center pr-3">{formatLakh(row.totalPayout)}</span>
                      <span className="self-stretch bg-blue-300" />
                      <span className="text-right self-center pl-3">{formatLakh(row.principal)}</span>
                      <span className="text-right font-semibold self-center">{formatLakh(row.totalPayout)}</span>
                    </div>
                  );
                }
                return (
                  <div key={row.quarter} className={`grid ${GRID_COLS} px-5 py-4 items-stretch ${row.isPast ? "bg-blue-50/60" : ""}`}>
                    <span className="font-semibold self-center">
                      Q{row.quarter}
                      {row.isPast && (
                        <span className="block text-xs font-bold text-gray-400 normal-case whitespace-nowrap">
                          Paid{row.roiPercent != null ? ` @ ${row.roiPercent.toFixed(0)}%` : ""}
                        </span>
                      )}
                      {row.isNextQuarter && (
                        <span className="block text-xs font-bold text-[#05CE78] normal-case whitespace-nowrap">
                          (Next Quarter)
                        </span>
                      )}
                    </span>
                    <span className="text-right self-center">
                      {row.isPast || row.isNextQuarter || row.cagrPrevBase == null
                        ? formatLakh(row.cagrBase)
                        : <>{formatLakh(row.cagrPrevBase)} <span className="text-gray-400">+</span> {formatLakh(row.cagrPrevPayout!)}</>}
                    </span>
                    <span className="text-right font-semibold text-[#05CE78] self-center pr-3">{formatLakh(row.cagrPayout)}</span>
                    <span className="self-stretch bg-blue-300" />
                    <span className="text-right self-center pl-3">{formatLakh(row.xirrBase)}</span>
                    <span className="text-right self-center">{formatLakh(row.xirrPayout)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
