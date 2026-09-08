"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  Briefcase, 
  TrendingUp, 
  Wallet, 
  ArrowRight, 
  Lock, 
  CheckCircle2,
  PieChart,
  Bus,
  Utensils,
  BedDouble,
  ChevronLeft,
  LayoutGrid
} from "lucide-react";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  minInvestment: string;
  totalFundSize: string;
  availableSlots: string; // "Available/Total"
  roi: string;
  available: boolean;
  imageUrl: string;
}

// Mock Data for Portfolio Tranches
export const portfolioData: Record<string, PortfolioItem> = {
  "1": {
    id: "hustlers-alpha",
    title: "Hustlers Portfolio - Alpha Fund",
    description: "A balanced mix of high-yield assets: Hyderabad Bus Pool (40%), Jadcherla F&B (30%), and Varanasi Hostel (30%).",
    minInvestment: "₹20,00,000",
    totalFundSize: "₹2,00,00,000",
    availableSlots: "5/20", 
    roi: "24% - 28%",
    available: true,
    imageUrl: "/portfolio/portfolio-alpha-cover.png", 
  },
  "2": {
    id: "hustlers-beta",
    title: "Hustlers Portfolio - Beta Fund",
    description: "Exclusive early access tranche focused on South India expansion assets.",
    minInvestment: "₹20,00,000",
    totalFundSize: "₹1,00,00,000",
    availableSlots: "0/10",
    roi: "22% - 26%",
    available: false,
    imageUrl: "/portfolio/portfolio-beta-cover.png", 
  },
};

export default function HustlersPortfolioPage() {
  const items = Object.values(portfolioData);

  const getFundedPercentage = (slotString: string) => {
    const [available, total] = slotString.split('/').map(Number);
    if (!total) return 0;
    const funded = total - available;
    return Math.round((funded / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-[#05CE78] selection:text-white pb-20">
      
      {/* --- DARK HERO SECTION --- */}
      <div className="relative bg-[#0B1120] pt-24 pb-48 overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M0 0H80V80H0V0Z" fill="url(#grid-pattern)" />
             <defs>
               <pattern id="grid-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                 <path d="M1 0V40M0 1H40" stroke="white" strokeWidth="0.5" />
               </pattern>
             </defs>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Link */}
          <Link 
            href="/opportunities" 
            className="inline-flex items-center text-gray-400 hover:text-white text-sm font-medium mb-8 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Opportunities
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] text-xs font-bold tracking-wider uppercase mb-6">
              <LayoutGrid className="w-3 h-3" />
              Structured Product
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Hustlers <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-400">
                Diversified Portfolio
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
              A balanced ecosystem combining <strong className="text-white">Transportation</strong>, <strong className="text-white">F&B</strong>, and <strong className="text-white">Hospitality</strong> assets. Designed for stable, risk-adjusted passive returns.
            </p>
          </div>
        </div>
      </div>

      {/* --- OVERLAPPING ALLOCATION SECTION --- */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 mb-16">
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Card 1: Transportation */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
              <Bus className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-gray-900">40%</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Transportation</div>
            </div>
          </div>

          {/* Card 2: F&B */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
              <Utensils className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-gray-900">30%</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Food & Beverage</div>
            </div>
          </div>

          {/* Card 3: Hospitality */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shadow-sm border border-green-100">
              <BedDouble className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-gray-900">30%</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Hospitality</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- LISTINGS GRID (UPDATED TO 3 COLUMNS) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-bold text-gray-900">Active Tranches</h2>
           <span className="text-sm font-medium text-gray-500">
             {items.filter(i => i.available).length} Open Funds
           </span>
        </div>

        {/* --- CHANGED: md:grid-cols-2 lg:grid-cols-3 --- */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const fundedPercent = getFundedPercentage(item.availableSlots);
            const isSoldOut = !item.available;

            return (
              <div
                key={item.id}
                className={`group bg-white rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col h-full
                  ${isSoldOut 
                    ? "border-gray-200 opacity-80 grayscale-[0.5] hover:grayscale-0" 
                    : "border-gray-100 shadow-lg hover:shadow-2xl hover:border-[#05CE78]/30 hover:-translate-y-2"
                  }`}
              >
                {/* 1. Card Image Area */}
                <div className="relative w-full h-56 bg-[#0B1120] overflow-hidden">
                  
                  {/* Actual Image Rendering */}
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isSoldOut ? 'grayscale-[0.8]' : ''}`}
                  />
                  
                  {/* Dark Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-black/20 to-transparent opacity-90" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    {isSoldOut ? (
                      <span className="bg-gray-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/10">
                        <Lock className="w-3 h-3" /> FULLY FUNDED
                      </span>
                    ) : (
                      <span className="bg-[#05CE78] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse-slow">
                        <CheckCircle2 className="w-3 h-3" /> OPEN TRANCHE
                      </span>
                    )}
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-6 z-10">
                    <h2 className="text-xl font-bold text-white mb-2 leading-tight drop-shadow-md">
                      {item.title}
                    </h2>
                    <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed drop-shadow-sm">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* 2. Card Body */}
                <div className="p-6 flex flex-col flex-1">
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                    {/* ROI */}
                    <div className="border-r border-gray-100">
                      <div className="flex items-center text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                        <TrendingUp className="w-3 h-3 mr-1.5" /> Target ROI
                      </div>
                      <div className="text-lg font-bold text-[#05CE78]">{item.roi}</div>
                    </div>

                    {/* Min Invest */}
                    <div className="pl-4">
                      <div className="flex items-center text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                        <Wallet className="w-3 h-3 mr-1.5" /> Entry Ticket
                      </div>
                      <div className="text-lg font-bold text-gray-900">{item.minInvestment}</div>
                    </div>

                    {/* Progress Bar (Spans Full Width) */}
                    <div className="col-span-2 pt-2">
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-xs text-gray-500 font-medium">
                           Total Fund: <span className="text-gray-900 font-bold">{item.totalFundSize}</span>
                        </div>
                        <div className="text-xs font-bold text-[#05CE78] bg-green-50 px-2 py-0.5 rounded-md">
                           {fundedPercent}% Funded
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${isSoldOut ? 'bg-gray-400' : 'bg-[#05CE78]'}`}
                          style={{ width: `${fundedPercent}%` }}
                        />
                      </div>
                      <div className="mt-2 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">
                         {item.availableSlots.split('/')[0]} Slots Remaining
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto">
                    <Link
                      href={isSoldOut ? "#" : `/opportunities/hustlers-portfolio/${item.id}`}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                        ${isSoldOut 
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                          : "bg-gray-900 text-white hover:bg-[#05CE78] shadow-lg shadow-gray-200 hover:shadow-green-900/20"
                        }`}
                    >
                      {isSoldOut ? (
                        "Waitlist Full"
                      ) : (
                        <>
                          View Prospectus <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}