"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AlertCircle, ArrowRight, X } from "lucide-react";

export default function SetupNudge() {
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('investors')
        .select('bank_account_no, nominee_name, pan_number')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const missing = [];
        if (!data.bank_account_no) missing.push("Link Payout Bank Account");
        //if (!data.nominee_name) missing.push("Add Nominee Details");
        if (!data.pan_number) missing.push("Link PAN Card");
        
        setMissingItems(missing);
      }
      setLoading(false);
    }
    checkProfile();
  }, []);

  if (loading || !isVisible || missingItems.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      
      <div className="flex gap-4">
        <div className="bg-orange-100 p-2.5 rounded-xl h-fit">
          <AlertCircle className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Complete your profile</h3>
          <p className="text-sm text-gray-600 mt-1">
            Action required to ensure smooth payouts:
          </p>
          <ul className="list-disc list-inside text-xs font-bold text-orange-700 mt-2 space-y-1">
            {missingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto pl-14 md:pl-0">
        <Link 
          href="/dashboard/settings" 
          className="flex-1 md:flex-none whitespace-nowrap px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          Go to Settings <ArrowRight className="w-4 h-4" />
        </Link>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-2 hover:bg-orange-100 text-gray-400 hover:text-orange-700 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}