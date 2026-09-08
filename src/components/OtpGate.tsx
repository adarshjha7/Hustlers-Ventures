"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Lock, Loader2, Mail, Phone, CheckCircle, ShieldCheck } from "lucide-react";

interface OtpGateProps {
  /** Display name of the asset, used in the modal heading and lead notification email. */
  assetTitle: string;
  /** Route to navigate to when the user closes the modal without completing verification. */
  backHref: string;
  children: React.ReactNode;
}

/**
 * Wraps page content behind an email-OTP verification gate.
 * - Skipped automatically if localStorage key "hustlers_investor_verified" is set.
 * - On success: sends a lead notification email and unlocks content for the session.
 */
export default function OtpGate({ assetTitle, backHref, children }: OtpGateProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  // OTP flow
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [userOtp, setUserOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const isUnlocked = localStorage.getItem("hustlers_investor_verified");
    if (!isUnlocked) {
      const timer = setTimeout(() => setShowModal(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const sendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Enter a valid email to receive the code");
      return;
    }
    setEmailError("");
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || "Investor" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpToken(data.token);
      setOtpSent(true);
    } catch {
      setEmailError("Failed to send code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setOtpError("");
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, enteredOtp: userOtp, token: otpToken }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpVerified(true);
      } else {
        setOtpError(data.expired ? "Code expired - request a new one." : "Incorrect code. Try again.");
      }
    } catch {
      setOtpError("Verification failed. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) return;

    let valid = true;
    if (!name.trim() || name.length < 3) { setNameError("Name must be at least 3 characters"); valid = false; } else setNameError("");
    if (valid) setNameError("");
    if (!valid) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      await fetch("/api/lead/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: name,
          fromEmail: email,
          phone: phone || undefined,
          subject: `New Verified Lead - ${assetTitle}`,
          message: `${name} (${email}${phone ? `, ${phone}` : ""}) verified their email and unlocked the ${assetTitle} business model page.`,
        }),
      });
      localStorage.setItem("hustlers_investor_verified", "true");
      setShowModal(false);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-md" />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300 border border-gray-100">
            <button
              onClick={() => router.push(backHref)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#05CE78]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#05CE78]/20">
                <Lock className="w-7 h-7 text-[#05CE78]" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Restricted Financial Data</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Verify your email to access revenue breakdowns and ROI projections for <strong>{assetTitle}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(""); }}
                  placeholder="Full Name"
                  className={`w-full border rounded-xl px-4 py-3.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${nameError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#05CE78]'}`}
                />
                {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
              </div>

              {/* Phone */}
              <div>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full pl-10 pr-3 py-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] transition-all font-medium"
                  />
                </div>
              </div>

              {/* Email + Send Code */}
              <div>
                <div className="flex gap-2">
                  <div className="relative w-full">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                        setOtpVerified(false);
                        setOtpSent(false);
                        setUserOtp("");
                        setOtpError("");
                      }}
                      disabled={otpVerified}
                      placeholder="Email Address"
                      className={`w-full pl-10 pr-3 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium ${
                        otpVerified
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : emailError
                          ? 'border-red-300 focus:ring-red-200 bg-gray-50'
                          : 'bg-gray-50 border-gray-200 focus:ring-[#05CE78] focus:bg-white'
                      }`}
                    />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={otpLoading || !email}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-5 rounded-xl text-xs font-bold whitespace-nowrap disabled:opacity-50 transition-colors"
                    >
                      {otpLoading ? <Loader2 className="animate-spin w-4 h-4" /> : otpSent ? "Resend" : "Send Code"}
                    </button>
                  )}
                </div>
                {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                {otpVerified && (
                  <p className="text-green-600 text-xs mt-2 flex items-center gap-1 font-bold animate-in slide-in-from-left-2">
                    <CheckCircle className="w-3 h-3" /> Email Verified
                  </p>
                )}
              </div>

              {/* OTP Input */}
              {otpSent && !otpVerified && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                  <p className="text-blue-800 text-xs mb-3 font-bold uppercase tracking-wide">Enter 6-digit Code</p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="XXXXXX"
                      value={userOtp}
                      onChange={(e) => { setUserOtp(e.target.value); setOtpError(""); }}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-center tracking-[0.5em] font-bold text-lg focus:ring-2 focus:ring-blue-400 outline-none"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg text-sm font-bold whitespace-nowrap"
                    >
                      Verify
                    </button>
                  </div>
                  {otpError && <p className="text-red-500 text-xs mt-2">{otpError}</p>}
                </div>
              )}

              {submitError && <p className="text-red-500 text-xs text-center">{submitError}</p>}

              <button
                type="submit"
                disabled={submitting || !otpVerified}
                className="w-full bg-[#05CE78] hover:bg-[#04b067] text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/10 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>Processing <Loader2 className="w-5 h-5 animate-spin" /></>
                ) : !otpVerified ? (
                  <><Lock className="w-4 h-4" /> Verify Email to Unlock</>
                ) : (
                  "Unlock Financials Now"
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium">
              <ShieldCheck className="w-3 h-3 text-[#05CE78]" />
              Secure Encrypted Connection
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-700 ${showModal ? 'filter blur-xl pointer-events-none select-none h-screen overflow-hidden' : ''}`}>
        {children}
      </div>
    </div>
  );
}
