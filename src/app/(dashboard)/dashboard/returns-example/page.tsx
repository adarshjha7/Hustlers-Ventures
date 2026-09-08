"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/logger";
import ReturnTypeExample from "@/components/ReturnTypeExample";
import PersonalizedReturnExample from "@/components/PersonalizedReturnExample";
import {
  EXAMPLE_PRINCIPAL, MIN_ROI_PERCENT, MAX_ROI_PERCENT, DEFAULT_ANNUAL_ROI_PERCENT, sliderTrackStyle,
} from "@/lib/returnTypeExample";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, CheckCircle, Eye, EyeOff } from "lucide-react";

interface PersonalizedData {
  assetName: string;
  principal: number;
  pastPayouts: number[];
  isExited: boolean;
  lastDeclaredRoiPercent: number | null;
}

function ReturnsExampleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investmentId = searchParams.get("investmentId");

  const [roiPercent, setRoiPercent] = useState(DEFAULT_ANNUAL_ROI_PERCENT);
  const [personalized, setPersonalized] = useState<PersonalizedData | null>(null);
  const [currentReturnType, setCurrentReturnType] = useState<"CAGR" | "XIRR">("XIRR");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!investmentId);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const [justConverted, setJustConverted] = useState(false);

  useEffect(() => {
    if (!investmentId) return;
    let cancelled = false;

    async function fetchInvestment() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        if (!cancelled) setAuthUserId(user.id);

        const [{ data: inv, error: invError }, { data: payments }] = await Promise.all([
          supabase
            .from("investor_investments")
            .select("investment_id, company_name, total_amount, return_type, company_pools(pool_name)")
            .eq("investment_id", investmentId)
            .single(),
          supabase
            .from("investor_quarterly_payments")
            .select("net_payable_amount, payment_date, quarterly_roi_declarations(roi_percentage)")
            .eq("investment_id", investmentId)
            .not("payment_date", "is", null)
            .order("payment_date", { ascending: true }),
        ]);

        if (invError || !inv) throw new Error("Investment not found");
        if (cancelled) return;

        const poolData = inv.company_pools as unknown as { pool_name: string } | null;
        const lastPayment = (payments ?? [])[payments!.length - 1] as unknown as { quarterly_roi_declarations: { roi_percentage: number } | null } | undefined;
        setPersonalized({
          assetName: inv.company_name || poolData?.pool_name || "Asset",
          principal: Number(inv.total_amount),
          pastPayouts: (payments ?? []).map(p => Number(p.net_payable_amount)),
          isExited: Number(inv.total_amount) === 0,
          lastDeclaredRoiPercent: lastPayment?.quarterly_roi_declarations?.roi_percentage
            ? Number(lastPayment.quarterly_roi_declarations.roi_percentage)
            : null,
        });
        setCurrentReturnType((inv.return_type as "CAGR" | "XIRR") ?? "XIRR");

        await logEvent("INFO", "User viewed full CAGR/XIRR example page", { userId: user.id, investmentId });
      } catch {
        if (!cancelled) setError("Could not load this investment's details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInvestment();
    return () => { cancelled = true; };
  }, [investmentId, router]);

  const canConvert = personalized && !personalized.isExited && currentReturnType !== "CAGR";

  const handleConfirmConvert = async () => {
    if (!password) { setConvertError("Please enter your password."); return; }
    if (!investmentId) return;
    setSubmitting(true);
    setConvertError("");
    try {
      const res = await fetch("/api/investor/convert-to-cagr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investment_id: investmentId, password }),
      });
      const data = await res.json();
      if (!res.ok) { setConvertError(data.error || "Something went wrong. Please try again."); return; }
      logEvent("INFO", "Investor confirmed CAGR conversion", { userId: authUserId, investmentId, assetName: personalized?.assetName }).catch(console.error);
      setCurrentReturnType("CAGR");
      setJustConverted(true);
      setShowPasswordField(false);
      setAgreedToTerms(false);
      setPassword("");
    } catch {
      setConvertError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-[10%] pb-6 pt-2 flex flex-col sm:flex-row items-start gap-3">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium shrink-0 sm:mt-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {loading ? (
        <div className="w-full flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#05CE78]" />
        </div>
      ) : error ? (
        <div className="w-full flex-1 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      ) : (
        <>
          <div className="w-full flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            {justConverted && (
              <div className="mb-4 bg-[#05CE78]/10 border border-[#05CE78]/30 text-[#04b86c] px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> Converted to CAGR — future payouts will reinvest into your principal.
              </div>
            )}

            <p className="text-base sm:text-lg text-center text-gray-600 leading-relaxed mb-2">
              <span className="font-bold text-gray-900">XIRR Model</span> pays out every quarter calculated on the principal invested, without reinvestment.
            </p>
            <p className="text-base sm:text-lg text-center text-gray-600 leading-relaxed mb-4">
              <span className="font-bold text-gray-900">CAGR Model</span> reinvests every quarterly payout back into your principal, so the next quarterly payout is calculated on an increased principal. Eg is attached below.
            </p>

            {personalized ? (
              <PersonalizedReturnExample
                principal={personalized.principal}
                pastPayouts={personalized.pastPayouts}
                lastDeclaredRoiPercent={personalized.lastDeclaredRoiPercent}
                compact
              />
            ) : (
              <>
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
              </>
            )}

            {canConvert && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <div className="flex items-start gap-2.5 mb-4">
                  <input
                    id="agree-terms-cagr"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#05CE78] focus:ring-[#05CE78] cursor-pointer"
                  />
                  <label htmlFor="agree-terms-cagr" className="text-sm text-gray-600 cursor-pointer">
                    I agree to the Terms &amp; Conditions for converting{" "}
                    <Link
                      href={`/dashboard/portfolio/${investmentId}`}
                      onClick={e => e.stopPropagation()}
                      className="font-bold text-[#05CE78] hover:underline"
                    >
                      my investment
                    </Link>{" "}
                    to CAGR Model. From my next payout, it will reinvest into my principal instead of being paid out. Once I opt for this, it will continue till the term of my investment.
                  </label>
                </div>

                <button
                  onClick={() => {
                    logEvent("INFO", "User clicked Convert to CAGR from returns-example page", { userId: authUserId, investmentId }).catch(console.error);
                    setShowPasswordField(true);
                  }}
                  disabled={!agreedToTerms}
                  className="w-full flex items-center justify-center gap-2 bg-[#05CE78] hover:bg-[#04b86c] text-white px-6 py-3 rounded-xl text-base font-bold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#05CE78]"
                >
                  <RefreshCw className="w-5 h-5" /> Convert to CAGR
                </button>

                {agreedToTerms && showPasswordField && (
                  <div className="mt-4">
                    {convertError && (
                      <div className="mb-3 bg-red-50 border border-red-100 text-red-600 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {convertError}
                      </div>
                    )}
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
                      Enter your password to confirm
                    </label>
                    <div className="relative mb-3">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setConvertError(""); }}
                        onKeyDown={e => { if (e.key === "Enter" && !submitting) handleConfirmConvert(); }}
                        placeholder="Enter your password"
                        autoFocus
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all font-medium pr-12"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleConfirmConvert}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</> : "Confirm Conversion"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ReturnsExamplePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#05CE78]" />
      </div>
    }>
      <ReturnsExampleContent />
    </Suspense>
  );
}