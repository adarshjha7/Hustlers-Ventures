"use client";

import { useState } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Mail,
} from "lucide-react";

type Step = "otp" | "form" | "success";

import { formatPhoneE164 } from "@/lib/phone";
const formatPhoneForDisplay = formatPhoneE164;

export default function OnboardForm({
  token,
  prefillName,
  prefillPhone,
}: {
  token: string;
  prefillName: string;
  prefillPhone: string;
}) {
  const [step, setStep] = useState<Step>("otp");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [investorId, setInvestorId] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState("");

  const [form, setForm] = useState({
    fullName: prefillName,
    phone: formatPhoneForDisplay(prefillPhone),
    email: "",
    pan: "",
    bankAcc: "",
    bankAccRe: "",
    ifsc: "",
    associate: "",
  });

  const setField = (k: keyof typeof form) => (v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from WhatsApp.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/onboard/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Invalid code");
      setStep("form");
    } catch (err: any) {
      setError(err?.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    const phoneDigits = form.phone.replace(/[^\d]/g, "");
    if (!/^\d{8,15}$/.test(phoneDigits)) {
      setError("Phone must be in international format (8-15 digits).");
      return;
    }
    if (form.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.pan)) {
      setError("PAN must look like ABCDE1234F.");
      return;
    }
    if (form.bankAcc && form.bankAcc !== form.bankAccRe) {
      setError("Bank account numbers don't match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/onboard/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp, form: { ...form, phone: phoneDigits } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit");
      setInvestorId(data.investorId);
      setStep("success");
    } catch (err: any) {
      setError(err?.message || "Failed to submit");
    } finally {
      setBusy(false);
    }
  };

  const handleResendEmail = async () => {
    if (!investorId) return;
    setResendNote("");
    setBusy(true);
    try {
      const res = await fetch("/api/onboard/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to resend");
      setResendNote("Email re-sent. Check your inbox in a minute.");
    } catch (err: any) {
      setResendNote(err?.message || "Failed to resend");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#0B1120] font-sans flex items-center justify-center lg:justify-start py-6 px-4 sm:py-10 sm:px-8 lg:p-12 overflow-x-hidden">
      {/* Decorative backdrop */}
      <div className="absolute -top-32 -right-32 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[700px] lg:h-[700px] bg-[#05CE78] opacity-10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-purple-900/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

      {/* Right-side brand text (desktop only) */}
      <div className="hidden lg:block absolute top-1/2 right-12 -translate-y-1/2 max-w-md text-right z-10">
        <div className="flex items-center gap-3 mb-6 justify-end">
          <div className="flex flex-col leading-none items-end">
            <span className="text-3xl font-extrabold text-white tracking-tight">HUSTLERS</span>
            <span className="text-sm font-bold text-[#05CE78] tracking-[0.2em] uppercase">Ventures</span>
          </div>
          <div className="w-12 h-12 bg-[#05CE78] rounded-xl flex items-center justify-center text-black font-extrabold">HV</div>
        </div>
        <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-3">
          Welcome aboard,
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Investor.</span>
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Co-own institutional-grade real-world businesses across transportation, hospitality, and highway F&amp;B.
        </p>
      </div>

      {/* DIALOG - left-anchored card on desktop, centered on mobile */}
      <div className="relative z-20 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-7 border border-white/10">
        {/* Compact branding header (visible on all sizes since the right-side text is desktop-only) */}
        <div className="flex items-center gap-3 mb-5 lg:hidden">
          <div className="w-9 h-9 bg-[#05CE78] rounded-lg flex items-center justify-center text-black font-bold text-sm">
            HV
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-extrabold text-gray-900">HUSTLERS</span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#05CE78] uppercase">
              Ventures
            </span>
          </div>
        </div>

        {step === "otp" && (
          <>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
              Verify your identity
            </h1>
            <p className="text-sm text-gray-500 mb-5">
              Enter the 6-digit code we sent to your WhatsApp.
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  if (error) setError("");
                }}
                placeholder="123456"
                className="w-full px-4 py-3.5 text-center tracking-[0.4em] sm:tracking-[0.5em] font-bold text-xl border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent"
              />
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="w-full bg-[#0B1120] hover:bg-[#05CE78] hover:text-black active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Verify
              </button>
            </form>
          </>
        )}

        {step === "form" && (
          <>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Investor details</h1>
            <p className="text-sm text-gray-500 mb-5">
              Complete your onboarding details.
            </p>
            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <Field
                label="Full Name *"
                value={form.fullName}
                onChange={setField("fullName")}
                autoComplete="name"
                autoCapitalize="words"
              />
              <Field
                label="Phone Number *"
                value={form.phone}
                onChange={setField("phone")}
                placeholder="+91 9876543210"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
              />
              <Field
                label="Email Address *"
                value={form.email}
                onChange={setField("email")}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
              />

              <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 leading-relaxed">
                The fields below are optional - you can complete them later from your dashboard.
              </p>

              <Field
                label="PAN Card Number"
                value={form.pan}
                onChange={(v) => setField("pan")(v.toUpperCase())}
                placeholder="ABCDE1234F"
                autoCapitalize="characters"
                maxLength={10}
              />
              <Field
                label="Bank Account Number"
                value={form.bankAcc}
                onChange={setField("bankAcc")}
                inputMode="numeric"
              />
              <Field
                label="Re-enter Bank Account Number"
                value={form.bankAccRe}
                onChange={setField("bankAccRe")}
                inputMode="numeric"
              />
              <Field
                label="IFSC"
                value={form.ifsc}
                onChange={(v) => setField("ifsc")(v.toUpperCase())}
                placeholder="HDFC0001234"
                autoCapitalize="characters"
                maxLength={11}
              />
              <Field
                label="Associate Name"
                value={form.associate}
                onChange={setField("associate")}
                autoCapitalize="words"
              />

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[#0B1120] hover:bg-[#05CE78] hover:text-black active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit & Create My Account
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto bg-[#05CE78]/10 text-[#05CE78] rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Account created!</h1>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Your login credentials have been sent to your email. Please change your password after first login.
            </p>
            <button
              onClick={handleResendEmail}
              disabled={busy}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#05CE78] border border-[#05CE78]/40 bg-[#05CE78]/5 hover:bg-[#05CE78]/10 active:scale-[0.98] px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Resend Email
            </button>
            {resendNote && (
              <p className="text-xs text-gray-500 mt-3">{resendNote}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
  autoCapitalize,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" | "search" | "url" | "none";
  autoComplete?: string;
  autoCapitalize?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        className="w-full px-4 py-3 text-base sm:text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all"
      />
    </div>
  );
}
