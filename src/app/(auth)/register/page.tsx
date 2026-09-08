"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, ArrowRight, Loader2, AlertCircle, CheckCircle,
  TrendingUp, Wallet, ShieldCheck, Eye, EyeOff, Lock, Info,
} from "lucide-react";
import { logEvent } from "@/lib/logger";

const features = [
  { icon: TrendingUp,  title: "High-Yield Real Assets",   description: "Co-own intercity fleet, hospitality, and highway F&B businesses." },
  { icon: Wallet,      title: "Quarterly Payouts",         description: "Receive dividends directly to your bank account every quarter." },
  { icon: ShieldCheck, title: "Invite-Only Platform",      description: "Exclusive access to curated opportunities vetted by our team." },
];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  pan_number: "",
  bank_account: "",
  bank_account_confirm: "",
  ifsc: "",
  return_type: "XIRR" as "CAGR" | "XIRR",
};

type TokenState = "validating" | "valid" | "invalid";

function RegisterForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") ?? "";

  const [tokenState, setTokenState] = useState<TokenState>("validating");
  const [tokenError, setTokenError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    if (!inviteToken) {
      setTokenState("invalid");
      setTokenError("No invite link found. Please use the link sent to your WhatsApp.");
      return;
    }
    fetch(`/api/invite/verify?token=${encodeURIComponent(inviteToken)}`)
      .then(r => r.json())
      .then(data => {
        if (data.phone) {
          setForm(f => ({ ...f, phone: data.phone }));
          setTokenState("valid");
        } else {
          setTokenState("invalid");
          setTokenError(data.error || "Invalid invite link.");
        }
      })
      .catch(() => {
        setTokenState("invalid");
        setTokenError("Could not validate your invite link. Please check your connection.");
      });
  }, [inviteToken]);

  useEffect(() => {
    const savedReturnType = sessionStorage.getItem("hv_register_return_type");
    if (savedReturnType === "CAGR" || savedReturnType === "XIRR") {
      setForm(f => ({ ...f, return_type: savedReturnType }));
      sessionStorage.removeItem("hv_register_return_type");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "phone") return; // phone is locked
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.bank_account !== form.bank_account_confirm) {
      setError("Bank account numbers do not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim().toLowerCase(),
          pan_number: form.pan_number.trim().toUpperCase(),
          bank_account: form.bank_account.trim(),
          ifsc: form.ifsc.trim().toUpperCase(),
          return_type: form.return_type,
          invite_token: inviteToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong. Please try again."); return; }
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all font-medium";
  const lockedInputClass = "w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 font-medium cursor-not-allowed";
  const labelClass = "block text-xs font-bold text-gray-900 uppercase tracking-wide mb-2";

  const leftPanel = (
    <div className="hidden lg:flex lg:w-1/2 bg-[#0B1120] relative overflow-hidden p-12 flex-col justify-start gap-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[180px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />
      <Link href="/" className="relative z-10 inline-flex items-center text-gray-400 hover:text-white transition-colors font-medium text-sm group">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      <div className="relative z-10 space-y-12 max-w-lg">
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-14 h-14">
              <Image src="/logo.svg" alt="Hustlers Ventures" fill
                sizes="36px" className="object-contain" priority />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-white tracking-tight leading-none">HUSTLERS</span>
              <span className="text-sm font-bold text-[#05CE78] tracking-[0.2em] uppercase">VENTURES</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-300">Start your investment</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] via-emerald-300 to-[#05CE78]">journey today.</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Apply to join our exclusive investor network and co-own high-yield real-world businesses.
          </p>
        </div>
        <div className="space-y-8 pl-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#05CE78] border border-white/10 group-hover:bg-[#05CE78] group-hover:text-black transition-all duration-300">
                <feature.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#05CE78] transition-colors">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="relative z-10 text-xs text-gray-600 font-medium tracking-wide mt-auto pt-8 border-t border-white/5">
        © {new Date().getFullYear()} HUSTLERS VENTURES. ALL RIGHTS RESERVED.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex font-sans selection:bg-[#05CE78] selection:text-white">
      {leftPanel}

      <div className="w-full lg:w-1/2 bg-white flex items-start justify-center p-8 sm:p-12 lg:px-24 lg:py-12 relative overflow-y-auto">
        <Link href="/" className="lg:hidden absolute top-8 left-8 inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm">
          <ChevronLeft className="w-4 h-4 mr-1" />Home
        </Link>

        <div className="w-full max-w-[400px] pt-12 lg:pt-4">

          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center justify-center mb-8">
            <div className="relative w-12 h-12 mb-2">
              <Image src="/logo.svg" alt="Hustlers Ventures" fill
                sizes="36px" className="object-contain" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">HUSTLERS</span>
              <span className="text-xs font-bold text-[#05CE78] tracking-[0.2em] uppercase">VENTURES</span>
            </div>
          </div>

          {/* Validating */}
          {tokenState === "validating" && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#05CE78] mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Validating your invite link…</p>
            </div>
          )}

          {/* Invalid token */}
          {tokenState === "invalid" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Invite Required</h2>
              <p className="text-gray-500 leading-relaxed mb-8">{tokenError}</p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#05CE78] hover:underline">
                Back to Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Success */}
          {tokenState === "valid" && submitted && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#05CE78]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-[#05CE78]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Account created!</h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Welcome to Hustlers Ventures. Your login credentials have been sent to your email and WhatsApp. Use them to sign in and explore your dashboard.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#05CE78] hover:underline">
                Sign In Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Form */}
          {tokenState === "valid" && !submitted && (
            <>
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Investor Application</h2>
                <p className="text-gray-500">Fill in your details and our team will get in touch.</p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Personal Details */}
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personal Details</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div>
                  <label className={labelClass}>Full Name</label>
                  <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Rahul Sharma" required className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>
                    Phone Number
                    <span className="ml-2 inline-flex items-center gap-1 text-[#05CE78] normal-case font-medium tracking-normal">
                      <Lock className="w-3 h-3" /> pre-filled from invite
                    </span>
                  </label>
                  <input name="phone" type="tel" value={form.phone} readOnly className={lockedInputClass} />
                </div>

                <div>
                  <label className={labelClass}>Email Address</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="rahul@example.com" required className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>PAN Card Number</label>
                  <input name="pan_number" type="text" value={form.pan_number} onChange={handleChange} placeholder="ABCDE1234F" required maxLength={10} className={`${inputClass} uppercase`} />
                </div>

                {/* Financial Details */}
                <div className="flex items-center gap-3 pt-2 mb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Financial Details</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div>
                  <label className={labelClass}>Bank Account Number</label>
                  <div className="relative">
                    <input name="bank_account" type={showAccount ? "text" : "password"} value={form.bank_account} onChange={handleChange} placeholder="••••••••••" required className={`${inputClass} pr-12`} />
                    <button type="button" onClick={() => setShowAccount(v => !v)} className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showAccount ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Re-enter Bank Account Number</label>
                  <input name="bank_account_confirm" type="text" value={form.bank_account_confirm} onChange={handleChange} placeholder="Re-enter account number" required className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>IFSC Code</label>
                  <input name="ifsc" type="text" value={form.ifsc} onChange={handleChange} placeholder="SBIN0001234" required maxLength={11} className={`${inputClass} uppercase`} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">Return Type</label>
                    <Link
                      href="/returns-example"
                      onClick={() => {
                        logEvent("INFO", "Applicant viewed CAGR/XIRR example on register form", { name: form.name || null, email: form.email || null, selectedReturnType: form.return_type }).catch(console.error);
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      title="See example"
                    >
                      <Info className="w-3.5 h-3.5" /> See example
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, return_type: "CAGR" }))}
                      className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${form.return_type === "CAGR" ? "border-[#05CE78] bg-[#05CE78]/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                    >
                      <span className="block text-sm font-bold text-gray-900">CAGR Model</span>
                      <span className="block text-xs text-gray-500 mt-0.5">For reinvested payments</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, return_type: "XIRR" }))}
                      className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${form.return_type === "XIRR" ? "border-[#05CE78] bg-[#05CE78]/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                    >
                      <span className="block text-sm font-bold text-gray-900">XIRR Model</span>
                      <span className="block text-xs text-gray-500 mt-0.5">Standard, lump-sum investment </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold py-4 rounded-xl transition-all active:scale-[0.99] hover:-translate-y-0.5 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  style={{ boxShadow: '0 0 0 1px rgba(5,206,120,0.3), 0 0 40px rgba(5,206,120,0.45), 0 0 80px rgba(5,206,120,0.2)' }}
                >
                  {submitting
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                    : <>Submit Application <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold text-[#05CE78] hover:text-emerald-700 hover:underline transition-colors">Sign In</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#05CE78] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
