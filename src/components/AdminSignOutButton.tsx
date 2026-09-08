"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LogOut, Loader2 } from "lucide-react";

export default function AdminSignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-colors text-[13px] font-semibold tracking-tight w-full disabled:opacity-50"
    >
      {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      {signingOut ? "Signing out..." : "Sign Out"}
    </button>
  );
}
