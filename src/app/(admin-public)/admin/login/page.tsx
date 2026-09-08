"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle, Eye, EyeOff, Clock } from "lucide-react";

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setSessionExpired(searchParams.get("reason") === "session_expired");
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      // Full reload guarantees server reads the fresh session cookie
      window.location.href = "/admin/investors";
    } catch (err: any) {
      setError(err.message === "Invalid login credentials" ? "Incorrect email or password." : err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#05CE78] rounded-xl flex items-center justify-center text-black font-bold text-lg shrink-0">
            HV
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-extrabold tracking-tight text-white leading-none">HUSTLERS</span>
            <span className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase mt-0.5">Ventures</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#05CE78]/10 border border-[#05CE78]/20 text-[#05CE78] text-[11px] font-bold tracking-wider uppercase">
            Admin Console
          </span>
          <p className="text-gray-600 text-xs mt-3">Restricted access · Authorised personnel only</p>
        </div>

        {/* Session expired banner */}
        {sessionExpired && (
          <div className="mb-5 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" /> Your session expired. Please sign in again.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              placeholder="admin@example.com"
              autoFocus
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#05CE78] hover:bg-[#04b067] font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-green-900/20 text-white"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Sign In to Admin"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginContent />
    </Suspense>
  );
}
