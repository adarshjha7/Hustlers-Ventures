"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/logger";

import {
  ChevronLeft,
  Eye,
  EyeOff,
  Wallet,
  ShieldCheck,
  LayoutDashboard,
  ArrowRight,
  Loader2,
  AlertCircle,
  Mail,
  CheckCircle,
  KeyRound,
  Clock,
} from "lucide-react";

// --- CONSTANTS ---

const features = [
  { icon: LayoutDashboard, title: "Deployed Capital", description: "See where your money is and what it's earning across every active asset, in real time." },
  { icon: Wallet, title: "Quarterly Payouts", description: "Every distribution tracked to the rupee, with receipts and TDS details ready to download." },
  { icon: ShieldCheck, title: "Your Vault", description: "Agreements, tax statements, and payout receipts, organised and ready whenever your CA needs them." },
];


const getFriendlyError = (msg: string): string => {
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password. Please try again.";
  if (msg.includes("Email not confirmed")) return "Please verify your email before signing in.";
  if (msg.includes("Too many requests")) return "Too many attempts. Please wait a few minutes and try again.";
  if (msg.includes("User not found")) return "No account found with this email.";
  return "Something went wrong. Please try again.";
};

// --- COMPONENT ---

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setSessionExpired(searchParams.get("reason") === "session_expired");
  }, [searchParams]);

  // Clear any stale/invalid refresh tokens on mount so Supabase doesn't
  // throw "Invalid Refresh Token" errors in the browser console.
  useEffect(() => {
    supabase.auth.signOut().catch(() => {});
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (error) setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Please enter both email and password.");
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      await logEvent('INFO', 'User logged in successfully', {
        email: formData.email,
        userId: data.user?.id
      });

      router.refresh();
      router.push("/dashboard");
    } catch (err: any) {
      await logEvent('WARN', 'Failed login attempt', {
        email: formData.email,
        errorDetails: err.message
      });

      setHasAttempted(true);
      setError(getFriendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (!formData.email) throw new Error("Please enter your email address.");

      await fetch("/api/password-reset/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      await logEvent('INFO', 'Password reset link requested', { email: formData.email });
      setSuccessMessage("If an account exists for that email, a reset link has been sent.");
    } catch (err: any) {
      await logEvent('WARN', 'Failed password reset request', {
        email: formData.email,
        errorDetails: err.message,
      });
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-[#05CE78] selection:text-white">

      {/* --- LEFT PANEL (Desktop) --- */}
      <div className="hidden lg:flex w-1/2 bg-[#0B1120] relative overflow-hidden p-12 flex-col justify-between">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[180px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 space-y-12 max-w-lg">
          <div>
            <Link href="/" className="flex items-center gap-4 mb-8 group w-fit">
              <div className="relative w-14 h-14">
                <Image src="/logo.svg" alt="Hustlers Ventures" fill
                sizes="56px" className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-white tracking-tight leading-none group-hover:text-[#05CE78] transition-colors">HUSTLERS</span>
                <span className="text-sm font-bold text-[#05CE78] tracking-[0.2em] uppercase">VENTURES</span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#05CE78] animate-pulse" />
              <span className="text-xs font-bold text-gray-400 tracking-[0.15em] uppercase">Investor Portal</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-300">Your assets are</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] via-emerald-300 to-[#05CE78]">working. Even now.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Every quarter, the businesses you own pay you back. Sign in to see exactly how much.
            </p>

            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/5">
              <div>
                <p className="text-lg font-extrabold text-white">22%+</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Avg. IRR</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-lg font-extrabold text-white">4</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Asset Classes</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-lg font-extrabold text-white">Quarterly</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Payouts</p>
              </div>
            </div>

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

        <p className="relative z-10 text-xs text-gray-600 font-medium tracking-wide pt-8 border-t border-white/5">
          © {new Date().getFullYear()} HUSTLERS VENTURES. ALL RIGHTS RESERVED.
        </p>
      </div>

      {/* --- RIGHT PANEL (Form) --- */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">

        <Link href="/" className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-xs font-semibold tracking-wide group">
          Back to Home
          <ChevronLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center justify-center mb-8">
            <Link href="/" className="flex flex-col items-center group">
              <div className="relative w-12 h-12 mb-2">
                <Image src="/logo.svg" alt="Hustlers Ventures" fill
                  sizes="48px" className="object-contain" />
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight leading-none group-hover:text-[#05CE78] transition-colors">HUSTLERS</span>
              <span className="text-xs font-bold text-[#05CE78] tracking-[0.2em] uppercase">VENTURES</span>
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              {view === 'login' ? 'Member Access' : 'Reset Password'}
            </h2>
            <p className="text-gray-500">
              {view === 'login' ? 'Your portfolio is waiting.' : 'Enter your email to receive a password reset link.'}
            </p>
          </div>

          {sessionExpired && (
            <div className="mb-6 bg-amber-50 border border-amber-100 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" /> Your session expired. Please sign in again.
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />{successMessage}
            </div>
          )}

          {/* LOGIN FORM */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoFocus
                  autoComplete="email"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all font-medium"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-bold text-gray-900 uppercase tracking-wide">Password</label>
                  <button type="button" onClick={() => { setView('forgot'); setError(""); setSuccessMessage(""); }} className="text-xs font-bold text-[#05CE78] hover:text-emerald-700 hover:underline">Forgot Password?</button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all font-medium pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold py-4 rounded-xl transition-all active:scale-[0.99] hover:-translate-y-0.5 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed" style={{ boxShadow: '0 0 0 1px rgba(5,206,120,0.3), 0 0 40px rgba(5,206,120,0.45), 0 0 80px rgba(5,206,120,0.2)' }}>
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Verifying...</> : <>Access Dashboard<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {view === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Email Address</label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoFocus
                    autoComplete="email"
                    className="w-full px-4 py-3.5 pl-11 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all font-medium"
                  />
                  <Mail className="absolute top-1/2 left-4 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#05CE78] hover:bg-[#04b86c] text-white font-bold py-4 rounded-xl transition-all active:scale-[0.99] hover:-translate-y-0.5 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed" style={{ boxShadow: '0 0 0 1px rgba(5,206,120,0.3), 0 0 40px rgba(5,206,120,0.45), 0 0 80px rgba(5,206,120,0.2)' }}>
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Sending...</> : <>Send Reset Link<KeyRound className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>
              <button type="button" onClick={() => { setView('login'); setError(""); setSuccessMessage(""); }} className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center justify-center gap-2 transition-colors">
                <ChevronLeft className="w-4 h-4" />Back to Sign In
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
