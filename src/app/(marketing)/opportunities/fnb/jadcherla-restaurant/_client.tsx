"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react"; // useEffect used for scroll lock + keyboard nav
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  MapPin,
  TrendingUp, 
  UtensilsCrossed,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Play,
  Images,
  Maximize2,
  BarChart3,
  Building2,
  Wallet,
  Bus,
  Car,
  ShieldCheck
} from "lucide-react";

import planImage from './restaurant-plan.jpg'; 
import topView from './top-view.png'; 
import frontView from './front-view.png'; 
import fullView from './full-view.png'; 

import ProjectTimeline, { TimelineEvent } from "@/components/ProjectTimeline"; 

const jadcherlaTimeline: TimelineEvent[] = [
  {
    date: "August 2025",
    title: "Land Acquisition & Legal Due Diligence",
    desc: "Secured 1.5 acres of highway-facing land. Title verification and lease deed registration completed.",
    status: "completed"
  },
  {
    date: "October 2025",
    title: "Master Plan Approval",
    desc: "Structural drawings and fleet parking layout approved by NHAI and local municipal body.",
    status: "completed"
  },
  {
    date: "April 2026",
    title: "Construction & Fitouts",
    desc: "Foundation work complete. Kitchen equipment procurement and interior furnishing in progress.",
    status: "current"
  },
  {
    date: "May 2026",
    title: "Soft Launch",
    desc: "Operational testing with 5 test buses daily. Staff training and menu finalization.",
    status: "upcoming"
  },
  {
    date: "July 2026",
    title: "First Investor Payout",
    desc: "First quarterly dividend distributed to investors based on May-June operational revenue.",
    status: "upcoming"
  }
];

// --- DATA ---
const galleryImages = [
  { src: planImage, label: "Master Plan Layout" },
  { src: topView, label: "Top of Restaurant" }, 
  { src: frontView, label: "Front View of Restaurant" },         
  { src: fullView, label: "Full View of Restaurant" },   
];

const VIDEO_URL = "/videos/jadcherla-drone.mp4"; 
const MAP_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d894.5441915246932!2d78.16561142037943!3d16.874576476551002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2s!5e1!3m2!1sen!2sin!4v1764870775746!5m2!1sen!2sin"; 

export default function JadcherlaRestaurantPage({ filledPct }: { filledPct: number | null }) {
  const [open, setOpen] = useState(false); // Image Modal
  const [isVideoOpen, setIsVideoOpen] = useState(false); // Video Modal
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- SCROLL LOCK & KEYBOARD NAV ---
  useEffect(() => {
    // Lock body scroll when modal is open
    if (open || isVideoOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (open) {
        if (e.key === "Escape") setOpen(false);
        else if (e.key === "ArrowLeft") setCurrent((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
        else if (e.key === "ArrowRight") setCurrent((prev) => (prev + 1) % galleryImages.length);
      }
      if (isVideoOpen) {
        if (e.key === "Escape") setIsVideoOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Cleanup
    };
  }, [open, isVideoOpen]);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((current - 1 + galleryImages.length) % galleryImages.length);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((current + 1) % galleryImages.length);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-[#05CE78] selection:text-white pb-32">
      
      {/* --- FLOATING CTA (Bottom) --- */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center pointer-events-none pb-6 sm:pb-8">
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-2xl border border-gray-100 pointer-events-auto transition-transform hover:scale-105 active:scale-95">
          <Link
            href="/opportunities/fnb/jadcherla-restaurant/business-model"
            className="flex items-center gap-3 bg-[#05CE78] text-white px-8 py-3.5 rounded-2xl font-bold text-lg shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] hover:bg-[#04b067] transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            View Financial Breakdown
          </Link>
        </div>
      </div>

      {/* --- DARK HERO SECTION --- */}
      <section className="relative bg-[#0B1120] pt-24 pb-48 overflow-hidden">
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
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#05CE78]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-[#05CE78]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Link */}
          <Link 
            href="/opportunities/fnb" 
            className="inline-flex items-center text-gray-400 hover:text-white font-medium transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> 
            Back to F&B Portfolio
          </Link>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              <UtensilsCrossed className="w-3 h-3" /> Live Deal
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Highway Pitstop <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-400">
                Jadcherla
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
              Strategic highway restaurant leveraging our own bus fleet for guaranteed footfall. 
              Serving the busy Hyderabad-Bangalore corridor.
            </p>
          </div>
        </div>
      </section>

      {/* --- OVERLAPPING INVESTMENT MEMO CARD --- */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            
            <div className="text-center md:text-left md:pr-4">
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">Total Project Value</div>
              <div className="text-4xl font-extrabold text-gray-900">₹1.2 Crores</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-[#05CE78] rounded-lg text-xs font-bold">
                 <CheckCircle2 className="w-3 h-3" /> Fully Fitted Asset
              </div>
            </div>

            <div className="text-center md:px-4 pt-6 md:pt-0">
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">Target Annual ROI</div>
              <div className="text-4xl font-extrabold text-[#05CE78]">25% - 30%</div>
              <div className="mt-2 text-xs text-gray-500 font-medium">
                Driven by 10+ Daily Fleet Buses
              </div>
            </div>

            <div className="text-center md:text-right md:pl-4 pt-6 md:pt-0">
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">Min. Investment</div>
              <div className="text-4xl font-extrabold text-gray-900">₹5 Lakhs</div>
              <div className="mt-2 text-xs text-gray-500 font-medium">
                ~4.1% Profit Share per slot
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FUNDING PROGRESS */}
      {filledPct !== null && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pool Funding</span>
              <span className={`text-sm font-extrabold ${filledPct >= 100 ? "text-gray-500" : "text-[#05CE78]"}`}>
                {Math.round(filledPct)}% Funded
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${filledPct >= 100 ? "bg-gray-400" : "bg-[#05CE78]"}`}
                style={{ width: `${Math.min(100, filledPct)}%` }} />
            </div>
            {filledPct >= 100 && <p className="text-xs text-gray-400 mt-2 font-medium">This pool is fully funded.</p>}
          </div>
        </section>
      )}

      {/* --- PARTNER LOGOS --- */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Infrastructure & Platform Partners</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { name: "NHAI", tag: "Approved Location", logo: "/brands/nhai.png" },
              { name: "Zomato", tag: "Listed On", logo: "/brands/zomato.png" },
              { name: "Swiggy", tag: "Listed On", logo: "/brands/swiggy.png" },
            ].map(({ name, tag, logo }) => (
              <div key={name} className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl border border-gray-200 bg-gray-50 min-w-[120px]">
                <img src={logo} alt={name} className="h-10 w-auto max-w-[100px] object-contain" />
                <span className="text-xs font-bold text-gray-700 text-center">{name}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#05CE78]">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PROBLEM & SOLUTION --- */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The Highway Gap</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Highway travel in India suffers from a lack of quality pitstops. We are bridging this gap with premium infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem Card */}
            <div className="bg-white rounded-3xl p-8 border border-red-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-50 text-red-600 rounded-xl">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">The Friction</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="pl-4 border-l-2 border-red-100">
                    <h4 className="font-bold text-gray-900 mb-1">Passenger Pain</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Zero hygiene in washrooms and questionable food quality at existing dhabas.
                    </p>
                  </div>
                  <div className="pl-4 border-l-2 border-red-100">
                    <h4 className="font-bold text-gray-900 mb-1">Driver Stress</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Lack of safe, ample parking for 13.5-metre multi-axle buses creates logistical nightmares.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Card */}
            <div className="bg-white rounded-3xl p-8 border border-[#05CE78]/20 shadow-sm hover:shadow-xl hover:shadow-green-900/5 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-50 text-[#05CE78] rounded-xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Our Solution</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="pl-4 border-l-2 border-[#05CE78]/30">
                    <h4 className="font-bold text-gray-900 mb-1">Premium Hygiene</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Airport-style washrooms with dedicated 24/7 cleaning staff.
                    </p>
                  </div>
                  <div className="pl-4 border-l-2 border-[#05CE78]/30">
                    <h4 className="font-bold text-gray-900 mb-1">Fleet-Ready Design</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      A layout engineered for effortless parking of large Volvo buses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProjectTimeline data={jadcherlaTimeline} />

      {/* --- VISUAL TOUR (VIDEO + GALLERY) --- */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">
                <Images className="w-3 h-3" /> Virtual Tour
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Site Progression</h2>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 h-auto lg:h-[500px]">
            
            {/* 1. Video Card */}
            <div 
              className="relative rounded-3xl overflow-hidden bg-gray-900 group min-h-[300px] shadow-xl cursor-pointer ring-1 ring-gray-900/5"
              onClick={() => setIsVideoOpen(true)}
            >
              <video 
                ref={videoRef}
                src={VIDEO_URL}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                muted
                loop
                playsInline
                autoPlay // Autoplay for the preview thumbnail
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform shadow-2xl">
                  <Play className="w-8 h-8 text-white fill-current ml-1" />
                </div>
              </div>
              
              <div className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-white/10">
                <Maximize2 className="w-4 h-4" />
              </div>

              <div className="absolute bottom-0 left-0 p-8 w-full">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#05CE78] text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-lg">
                        Drone View
                    </span>
                    <span className="text-gray-300 text-xs font-mono">00:15</span>
                </div>
                <div className="text-white font-bold text-2xl tracking-tight">Aerial Site Survey</div>
              </div>
            </div>

            {/* 2. Photo Grid (Right) */}
            <div className="grid grid-cols-2 gap-4 h-full">
              {galleryImages.slice(0, 4).map((img, idx) => (
                <div 
                  key={idx}
                  className="relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 aspect-[4/3] lg:aspect-auto"
                  onClick={() => {
                    setCurrent(idx);
                    setOpen(true);
                  }}
                >
                  <Image 
                    src={img.src} 
                    alt={img.label}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    placeholder="blur" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  
                  {/* Plus Icon on the last image */}
                  {idx === 3 && galleryImages.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                      <Images className="w-8 h-8 mb-2" />
                      <span className="font-bold text-lg">+{galleryImages.length - 4} More</span>
                    </div>
                  )}
                  
                  {/* Label on Hover */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg border border-gray-100 text-center">
                    {img.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- TRAFFIC & THESIS --- */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Thesis */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 mb-4">
                    <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
                    <span className="text-[#05CE78] font-bold text-sm uppercase tracking-widest">Market Thesis</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    Gateway to <br/>
                    <span className="text-[#05CE78]">South India</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Jadcherla is the critical junction connecting Hyderabad to Bangalore, Tirupati, and Mysore. By controlling this pitstop, we capture traffic from the busiest corridors in the region.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                  {[
                    { label: "Bangalore Route", val: "200+", icon: Bus },
                    { label: "Tirupati Route", val: "70+", icon: Bus },
                    { label: "Chennai Route", val: "40+", icon: Bus },
                    { label: "Kurnool RTC", val: "200+", icon: Bus }, 
                    { label: "Daily Fleet", val: "10+", icon: Bus },
                    { label: "Coimbatore", val: "10+", icon: Bus },
                    { label: "Private Car Traffic", val: "High Volume", icon: Car, highlight: true, fullWidth: true },
                  ].map((route, i) => (
                    <div 
                      key={i} 
                      className={`
                        relative p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between
                        ${route.fullWidth ? 'col-span-2 sm:col-span-3 bg-[#0B1120] border-[#0B1120]' : 'bg-white border-gray-100 hover:shadow-md'}
                      `}
                    >
                      <div className={`mb-3 w-8 h-8 rounded-full flex items-center justify-center ${route.fullWidth ? 'bg-white/10 text-[#05CE78]' : 'bg-gray-50 text-gray-400'}`}>
                        <route.icon className="w-4 h-4" />
                      </div>

                      <div>
                        <div className={`text-xl font-extrabold ${route.fullWidth ? 'text-[#05CE78]' : 'text-gray-900'}`}>
                          {route.val}
                        </div>
                        <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${route.fullWidth ? 'text-gray-400' : 'text-gray-400'}`}>
                          {route.label}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: Map Card */}
            <div className="group rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 relative h-[500px]">
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 border border-gray-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                Prime Corridor Location
              </div>
              <iframe
                src={MAP_EMBED_URL}
                width="100%"
                height="100%"
                className="border-0 grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                allowFullScreen
                loading="lazy"
                title="Property Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- MASTER PLAN --- */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Approved Master Plan</h2>
              <p className="text-gray-600">Optimized specifically for high-throughput bus operations.</p>
            </div>
          </div>

          <div 
            className="group relative w-full aspect-[21/9] bg-gray-50 rounded-3xl overflow-hidden border border-gray-200 cursor-zoom-in shadow-sm hover:shadow-2xl transition-all duration-300"
            onClick={() => {
              setCurrent(0); 
              setOpen(true);
            }}
          >
            <Image
              src={planImage}
              alt="Master Plan Full View"
              fill
              sizes="100vw"
              className="object-contain transition-transform duration-700 group-hover:scale-105 p-8"
              placeholder="blur"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="bg-white text-gray-900 px-6 py-3 rounded-full text-sm font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform flex items-center gap-2">
                 View Detailed Blueprint <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* HUSTLERS VENTURES ASSURANCE */}
      <div className="bg-[#05CE78]/5 border-y border-[#05CE78]/15 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start sm:items-center gap-4">
          <ShieldCheck className="w-7 h-7 text-[#05CE78] shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <p className="font-bold text-gray-900 text-sm">Hustlers Ventures Assurance</p>
            <p className="text-sm text-gray-500 mt-0.5">We take accountability for delays. Your returns are calculated from day one of your investment, not day one of operations.</p>
          </div>
        </div>
      </div>

      {/* --- CTA SECTION --- */}
      <section className="py-24 bg-[#0B1120] text-white text-center px-4 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[150px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Invest in the Highway Economy.</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            This is a rare opportunity to enter the high-cash-flow highway F&B market with a strategic advantage.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://wa.me/919000272020"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#05CE78] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#04b067] transition-all shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] flex items-center justify-center gap-2"
            >
              Secure a Slot on WhatsApp
            </a>
            <Link
               href="/opportunities/fnb/jadcherla-restaurant/business-model"
               className="bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-4 h-4" /> ROI Simulator
            </Link>
          </div>
        </div>
      </section>

      {/* --- VIDEO MODAL --- */}
      {isVideoOpen && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
          onClick={() => setIsVideoOpen(false)}
        >
          <button
            className="absolute top-6 right-6 text-white/50 hover:text-white transition p-3 bg-white/10 rounded-full hover:bg-white/20 z-[101]"
            onClick={(e) => { e.stopPropagation(); setIsVideoOpen(false); }}
            aria-label="Close video"
          >
            <X size={24} />
          </button>
          
          <div 
            className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <video 
              src={VIDEO_URL}
              className="w-full h-full"
              controls
              autoPlay
            />
          </div>
        </div>
      )}

      {/* --- IMAGE GALLERY MODAL --- */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[99] p-4 animate-in fade-in duration-300"
          onClick={() => setOpen(false)} 
        >
          <button
            className="absolute top-6 right-6 text-white/50 hover:text-white transition p-3 bg-white/10 rounded-full hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            aria-label="Close gallery"
          >
            <X size={24} />
          </button>

          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition hidden sm:flex"
            onClick={prev}
            aria-label="Previous image"
          >
            <ChevronLeft size={40} />
          </button>

          <div 
            className="relative w-full max-w-6xl h-[85vh]"
            onClick={(e) => e.stopPropagation()} 
          >
            <Image
              src={galleryImages[current].src}
              alt={galleryImages[current].label}
              fill
              sizes="100vw"
              className="object-contain"
              placeholder="blur"
            />
            
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 uppercase tracking-wide">
                {galleryImages[current].label} • {current + 1} / {galleryImages.length}
              </span>
            </div>
          </div>

          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition hidden sm:flex"
            onClick={next}
            aria-label="Next image"
          >
            <ChevronRight size={40} />
          </button>
        </div>
      )}
    </div>
  );
}