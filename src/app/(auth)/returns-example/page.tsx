"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReturnTypeExample from "@/components/ReturnTypeExample";
import {
  EXAMPLE_PRINCIPAL, MIN_ROI_PERCENT, MAX_ROI_PERCENT, DEFAULT_ANNUAL_ROI_PERCENT, sliderTrackStyle,
} from "@/lib/returnTypeExample";
import { ArrowLeft } from "lucide-react";

export default function PublicReturnsExamplePage() {
  const router = useRouter();
  const [roiPercent, setRoiPercent] = useState(DEFAULT_ANNUAL_ROI_PERCENT);

  return (
    <div className="px-4 sm:px-[10%] pb-6 pt-2 flex flex-col sm:flex-row items-start gap-3">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium shrink-0 sm:mt-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="w-full flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <p className="text-base sm:text-lg text-center text-gray-600 leading-relaxed mb-2">
          <span className="font-bold text-gray-900">XIRR Model</span> pays out every quarter calculated on the principal invested, without reinvestment.
        </p>
        <p className="text-base sm:text-lg text-center text-gray-600 leading-relaxed mb-4">
          <span className="font-bold text-gray-900">CAGR Model</span> reinvests every quarterly payout back into your principal, so the next quarterly payout is calculated on an increased principal. Eg is attached below.
        </p>

        <div className="max-w-sm mx-auto mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Investment</span>
            <span className="text-base font-black text-gray-900">₹{(EXAMPLE_PRINCIPAL / 100000).toFixed(2)}L</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Returns %</span>
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

        <ReturnTypeExample annualRoiPercent={roiPercent} compact />
      </div>
    </div>
  );
}
