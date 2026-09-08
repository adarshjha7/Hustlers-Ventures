"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/logger"; 
import { 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  User, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  BadgeCheck, 
  Users,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";

// Matches your 'public.investors' schema
interface InvestorProfile {
  investor_id: string;
  investor_name: string;
  email: string | null;
  phone: string | null;
  pan_number: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  is_active: boolean;
  nominee_name?: string; 
  requires_password_change: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // --- HELPER: Detect Bank Name from IFSC ---
  const getBankName = (ifsc: string | null) => {
    if (!ifsc || ifsc.length < 4) return "Bank Account";
    const prefix = ifsc.substring(0, 4).toUpperCase();
    const banks: Record<string, string> = {
      'HDFC': 'HDFC Bank', 'SBIN': 'State Bank of India', 'ICIC': 'ICICI Bank',
      'UTIB': 'Axis Bank', 'KKBK': 'Kotak Mahindra Bank', 'PUNB': 'Punjab National Bank'
    };
    return banks[prefix] || "Bank Account";
  };

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        // 1. ADD THIS CHECK: Kick to login if no active session
        if (authError || !user) {
          router.push('/login');
          return;
        }
        setAuthUserId(user.id);
        
        // 2. Proceed with fetching the profile
        const { data, error } = await supabase
          .from('investors')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
          
        if (data) {
          setProfile({
            investor_id: data.investor_id,
            investor_name: data.investor_name,
            email: data.email || user.email || "",
            phone: data.phone,
            pan_number: data.pan_number,
            bank_account_no: data.bank_account_no,
            bank_ifsc: data.bank_ifsc,
            is_active: data.is_active,
            nominee_name: data.associate_name,
            requires_password_change: data.requires_password_change || false
          });
        }
      } catch (err: any) {
        console.error("Error loading profile:", err);
        await logEvent('ERROR', 'Failed to load user profile in settings', {
          userId: authUserId,
          errorDetails: err.message || err
        });
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [router]); // <-- Also added router to dependency array to satisfy React hooks rule

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (passwords.newPassword.length < 8) {
      setStatus({ type: 'error', message: "Password must be at least 8 characters long." });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setStatus({ type: 'error', message: "New passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      // 1. Update Auth Password
      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
      if (error) throw error;

      // 2. Clear the trap flag in the database if it was true
      if (profile?.requires_password_change) {
        const { error: dbError } = await supabase
          .from('investors')
          .update({ requires_password_change: false })
          .eq('investor_id', profile.investor_id);

        if (dbError) throw dbError;

        // LOG SUCCESSFUL ONBOARDING PASSWORD UPDATE
        await logEvent('INFO', 'User completed mandatory password setup', {
          userId: authUserId,
          email: profile?.email
        });

        setStatus({ type: 'success', message: "Password secured! Unlocking dashboard..." });
        
        // Instantly unlock the UI locally
        setProfile(prev => prev ? { ...prev, requires_password_change: false } : null);
        
        setTimeout(() => {
          window.location.href = '/dashboard'; 
        }, 1500); 
        return;
      }
      
      // LOG SUCCESSFUL ROUTINE PASSWORD UPDATE
      await logEvent('INFO', 'User updated password successfully', {
        userId: authUserId,
        email: profile?.email
      });

      setStatus({ type: 'success', message: "Password updated successfully!" });
      setPasswords({ newPassword: "", confirmPassword: "" });
      setLoading(false);
    } catch (error: any) {
      // LOG FAILED PASSWORD UPDATE
      await logEvent('WARN', 'Failed to update password in settings', {
        userId: authUserId,
        errorDetails: error.message
      });

      setStatus({ type: 'error', message: error.message || "Failed to update password." });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-52 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-52 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: "60ms" }} />
          <div className="md:col-span-2 h-40 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: "120ms" }} />
          <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: "180ms" }} />
        </div>
      </div>
    );
  }

  const isLocked = profile?.requires_password_change;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-12">
      
      {/* --- ACTION REQUIRED BANNER --- */}
      {isLocked && (
        <div className="bg-[#0B1120] border-l-4 border-[#05CE78] p-6 rounded-xl shadow-lg flex items-start sm:items-center gap-4 animate-bounce-once">
          <div className="p-3 bg-[#05CE78]/20 rounded-full flex-shrink-0 text-[#05CE78]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">Action Required: Secure Your Account</h2>
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">
              Welcome to the Hustlers Ventures Investor Portal! Before you can view your portfolio and documents, you must change your default password to a secure, private password.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      {!isLocked && (
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Account Settings
            </h2>
            <p className="text-gray-500 mt-1">Manage your profile, banking details, and security.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* --- ROW 1: IDENTITY (Left) --- */}
        <div className={`md:col-span-2 h-full transition-opacity duration-300 ${isLocked ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col relative">
            {isLocked && <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px]" />}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#05CE78] to-emerald-300" />
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#05CE78]" /> Identity Details
              </h3>
              {profile?.is_active ? (
                <span className="bg-[#05CE78]/10 text-[#05CE78] text-xs font-bold px-2.5 py-1 rounded border border-[#05CE78]/20 flex items-center gap-1.5">
                  <BadgeCheck className="w-3 h-3" /> KYC Verified
                </span>
              ) : (
                <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2.5 py-1 rounded border border-yellow-500/20">
                  Verification Pending
                </span>
              )}
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 flex-1">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Full Name</label>
                <p className="text-gray-900 font-semibold text-lg">{profile?.investor_name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Email Address</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 font-medium truncate">{profile?.email}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Phone Number</label>
                <p className="text-gray-900 font-medium">{profile?.phone || "--"}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">PAN Number</label>
                <p className="text-gray-900 font-medium tracking-widest font-mono bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-200 text-sm">
                  {profile?.pan_number 
                    ? `${profile.pan_number.slice(0, 1)}**** ***${profile.pan_number.slice(-2)}` 
                    : "Not Linked"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- ROW 1: SECURITY (Right - Highlighted if Locked) --- */}
        <div className={`md:col-span-1 h-full transition-all duration-300 ${isLocked ? 'ring-2 ring-[#05CE78] shadow-[0_0_30px_rgba(5,206,120,0.15)] rounded-2xl relative z-20 md:-translate-y-2' : ''}`}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400" />
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${isLocked ? 'text-[#05CE78] animate-pulse' : 'text-blue-500'}`} />
                {isLocked ? 'Update Password' : 'Security'}
              </h3>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              {status && (
                <div className={`mb-4 p-3 rounded-lg text-xs font-bold flex items-start gap-2 ${
                  status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {status.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                  {status.message}
                </div>
              )}
              
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">New Password</label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirm Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#05CE78] focus:border-transparent transition-all"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !passwords.newPassword}
                  className={`w-full flex justify-center items-center gap-2 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ${
                    isLocked
                      ? 'bg-[#05CE78] text-black hover:bg-[#04b86c]'
                      : 'bg-[#05CE78] hover:bg-[#04b86c] text-black'
                  }`}
                >
                  {loading && status === null ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isLocked ? 'Secure Account & Continue' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* --- ROW 2: PAYOUT (Left) --- */}
        <div className={`md:col-span-2 h-full transition-opacity duration-300 ${isLocked ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col relative">
            {isLocked && <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px]" />}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-purple-400" />
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-500" /> Payout Account
              </h3>
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Primary</span>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between">
              {profile?.bank_account_no ? (
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xl">{getBankName(profile.bank_ifsc)}</h4>
                    <p className="text-gray-500 font-mono text-sm flex items-center gap-2 mt-0.5">
                      •••• •••• {profile.bank_account_no.slice(-4)}
                      <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-gray-200">{profile.bank_ifsc}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 opacity-60 mb-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xl">Bank Account</h4>
                    <p className="text-gray-500 text-sm">Not Linked</p>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 items-start">
                 <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                 <p className="text-xs text-amber-800 leading-relaxed font-medium">
                   To change or link your bank account, please contact support. For security reasons, bank details cannot be edited directly here.
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- ROW 2: NOMINEE (Right) --- */}
        <div className={`md:col-span-1 h-full transition-opacity duration-300 ${isLocked ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col relative">
            {isLocked && <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px]" />}
            <div className="px-6 py-4 border-b border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400" />
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" /> Nominee Details
              </h3>
            </div>
            <div className="p-6 flex-1">
              <div className="mb-5">
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Nominee Name</label>
                 <p className="text-gray-900 font-bold text-lg">
                   {profile?.nominee_name || "Not Added"}
                 </p>
              </div>
              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Relationship</label>
                 <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded text-xs font-bold inline-block border border-gray-200">
                   N/A
                 </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}