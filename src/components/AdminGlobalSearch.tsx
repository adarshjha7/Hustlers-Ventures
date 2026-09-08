"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, TrendingUp, Lightbulb, X, Loader2, Landmark } from "lucide-react";

interface InvestorResult  { investor_id: string; investor_name: string; email: string; requires_password_change: boolean; }
interface InvestmentResult { investment_id: string; name: string; total_amount: number; investor_email: string; }
interface OpportunityResult { id: string; title: string; tagline: string | null; status: string; category: string | null; }
interface LoanResult { loan_id: string; borrower_name: string; loan_type: string; status: string; principal: number; }

interface Results {
  investors: InvestorResult[];
  investments: InvestmentResult[];
  opportunities: OpportunityResult[];
  loans: LoanResult[];
}

const STATUS_COLORS: Record<string, string> = {
  active:      "bg-green-50 text-green-700 border-green-200",
  coming_soon: "bg-blue-50 text-blue-700 border-blue-200",
  closed:      "bg-orange-50 text-orange-600 border-orange-200",
  draft:       "bg-gray-100 text-gray-500 border-gray-200",
};

export default function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") { setOpen(false); setQuery(""); setResults(null); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  };

  const hasResults = results && (results.investors.length > 0 || results.investments.length > 0 || results.opportunities.length > 0 || results.loans.length > 0);
  const noResults  = results && !hasResults;

  return (
    <div ref={containerRef} className="relative w-72">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${open ? "bg-white border-[#05CE78] ring-2 ring-[#05CE78]/20" : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}>
        {loading ? <Loader2 className="w-4 h-4 text-gray-400 shrink-0 animate-spin" /> : <Search className="w-4 h-4 text-gray-400 shrink-0" />}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search… ⌘K"
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (hasResults || noResults) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden max-h-[480px] overflow-y-auto">

          {noResults && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No results for "{query}"</div>
          )}

          {results!.investors.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Investors
              </p>
              {results!.investors.map(inv => (
                <button key={inv.investor_id} onClick={() => navigate(`/admin/investors/${inv.investor_id}`)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#05CE78]/10 flex items-center justify-center text-xs font-bold text-[#05CE78] shrink-0">
                    {inv.investor_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{inv.investor_name}</p>
                    <p className="text-xs text-gray-400 truncate">{inv.email}</p>
                  </div>
                  {inv.requires_password_change && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded shrink-0">Pending</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results!.investments.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Investments
              </p>
              {results!.investments.map(inv => (
                <button key={inv.investment_id} onClick={() => navigate(`/admin/investments`)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{inv.name}</p>
                    <p className="text-xs text-gray-400 truncate">{inv.investor_email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results!.opportunities.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3" /> Opportunities
              </p>
              {results!.opportunities.map(opp => (
                <button key={opp.id} onClick={() => navigate(`/admin/opportunities`)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{opp.title}</p>
                    {opp.category && <p className="text-xs text-gray-400">{opp.category}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${STATUS_COLORS[opp.status] ?? STATUS_COLORS.draft}`}>
                    {opp.status === "coming_soon" ? "New" : opp.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results!.loans.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
                <Landmark className="w-3 h-3" /> Loans
              </p>
              {results!.loans.map(loan => (
                <button key={loan.loan_id} onClick={() => navigate(`/admin/loans`)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                    <Landmark className="w-3.5 h-3.5 text-cyan-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{loan.borrower_name}</p>
                    <p className="text-xs text-gray-400">{loan.loan_type} · ₹{Number(loan.principal).toLocaleString("en-IN")}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${loan.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                    {loan.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
