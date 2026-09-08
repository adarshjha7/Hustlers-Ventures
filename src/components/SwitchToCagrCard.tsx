"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import {
  MIN_ROI_PERCENT, MAX_ROI_PERCENT, sliderTrackStyle,
  buildCagrSchedule, buildXirrSchedule, cagrFinalTotal, xirrTotals,
  linearAnnualRoiPercent,
} from "@/lib/returnTypeExample";

const CARD_DEFAULT_ROI_PERCENT = 24;
const SUMMARY_GRID_COLS = "grid-cols-[1fr_84px_84px] sm:grid-cols-[1fr_160px_160px]";

interface SwitchToCagrCardProps {
  totalPrincipal: number;
  eligibleCount: number;
  singleAssetName?: string;
  onCtaClick: () => void;
}

export default function SwitchToCagrCard({ totalPrincipal, eligibleCount, singleAssetName, onCtaClick }: SwitchToCagrCardProps) {
  const [roiPercent, setRoiPercent] = useState(CARD_DEFAULT_ROI_PERCENT);

  const cagrSchedule = useMemo(() => buildCagrSchedule(totalPrincipal, roiPercent), [totalPrincipal, roiPercent]);
  const xirrSchedule = useMemo(() => buildXirrSchedule(totalPrincipal, roiPercent), [totalPrincipal, roiPercent]);
  const cagrFinal = useMemo(() => cagrFinalTotal(cagrSchedule), [cagrSchedule]);
  const { totalPayouts: xirrTotalPayout } = useMemo(() => xirrTotals(xirrSchedule, totalPrincipal), [xirrSchedule, totalPrincipal]);
  const cagrTotalPayout = cagrFinal - totalPrincipal;

  const cagrAnnualRoi = useMemo(() => linearAnnualRoiPercent(cagrTotalPayout, totalPrincipal), [cagrTotalPayout, totalPrincipal]);
  const xirrAnnualRoi = useMemo(() => linearAnnualRoiPercent(xirrTotalPayout, totalPrincipal), [xirrTotalPayout, totalPrincipal]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border-l-4 border-cyan-500 border border-cyan-100 p-4 sm:p-6"
      style={{ background: "linear-gradient(135deg, #ecfeff 0%, #f0fdff 40%, #ffffff 100%)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200 uppercase tracking-wide">
          Switch to CAGR
        </span>
      </div>
      <h3 className="text-base font-black text-gray-900 mb-2">
        {eligibleCount === 1
          ? `Let ${singleAssetName || "your asset"}'s payouts compound instead`
          : `${eligibleCount} assets are on XIRR — switch them to compounding`}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-1">
        <span className="font-bold text-gray-900">XIRR</span> pays your quarterly return out flat, on your original principal, every time.
      </p>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5">
        <span className="font-bold text-cyan-600">CAGR</span> reinvests each payout straight back into your principal, so every following quarter compounds on a larger base, growing faster the longer you stay invested.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-5 mb-4">
        <div className="w-full">
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Investment Amount</span>
            <span className="text-sm sm:text-base font-black text-gray-900 text-right">{formatCurrency(totalPrincipal)}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Returns %</span>
            <span className="text-base font-black text-cyan-600">{roiPercent}%</span>
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
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{MIN_ROI_PERCENT}%</span>
            <span>{MAX_ROI_PERCENT}%</span>
          </div>
        </div>

        <div className="w-full bg-white border border-cyan-100 rounded-2xl px-3 py-4 sm:px-7 sm:py-6 overflow-x-auto">
          <div className={`grid ${SUMMARY_GRID_COLS} gap-2 sm:gap-5 pb-3 border-b border-solid border-gray-200 min-w-[280px]`}>
            <span />
            <span className="text-xs sm:text-base font-bold text-cyan-600 uppercase tracking-wide text-right">CAGR</span>
            <span className="text-xs sm:text-base font-bold text-cyan-600 uppercase tracking-wide text-right border-l border-gray-200 pl-2 sm:pl-5">XIRR</span>
          </div>
          <div className={`grid ${SUMMARY_GRID_COLS} gap-2 sm:gap-5 py-3 sm:py-4 border-b border-solid border-gray-200 items-center min-w-[280px]`}>
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">Total Payout</p>
              <p className="text-xs text-gray-400">(5 Years)</p>
            </div>
            <span className="text-sm sm:text-xl font-black text-gray-900 text-right">{formatCurrency(cagrTotalPayout)}</span>
            <span className="text-sm sm:text-xl font-black text-gray-900 text-right border-l border-gray-200 pl-2 sm:pl-5">{formatCurrency(xirrTotalPayout)}</span>
          </div>
          <div className={`grid ${SUMMARY_GRID_COLS} gap-2 sm:gap-5 pt-3 sm:pt-4 items-center min-w-[280px]`}>
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">Avg. Annual ROI %</p>
              <p className="text-xs text-gray-400">(5 Years)</p>
            </div>
            <span className="text-base sm:text-xl font-bold text-[#05CE78] text-right">{cagrAnnualRoi.toFixed(1)}%</span>
            <span className="text-base sm:text-xl font-bold text-[#05CE78] text-right border-l border-gray-200 pl-2 sm:pl-5">{xirrAnnualRoi.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5">
        <p className="text-sm sm:text-base text-gray-600 font-medium">
          Pick any eligible asset below and switch it to CAGR whenever you're ready.
        </p>

        <button
          onClick={onCtaClick}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          {eligibleCount === 1 ? "Convert to CAGR" : "View Eligible Assets"}
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
