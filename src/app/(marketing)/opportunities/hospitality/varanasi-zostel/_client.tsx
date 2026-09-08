"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  TrendingUp,
  Users,
  Building2,
  Coffee,
  Zap,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";

import locationPin from './images/location.png';

// Import the timeline component
import ProjectTimeline, { TimelineEvent } from "@/components/ProjectTimeline";

// Timeline Data
const zostelTimeline: TimelineEvent[] = [
  {
    date: "October 2025",
    title: "Property Lease Signed",
    desc: "5-year lease agreement signed for a 4-story heritage property in Varanasi.",
    status: "completed"
  },
  {
    date: "November 2025",
    title: "Renovations & Interiors",
    desc: "Civil work completed. Currently installing bunk beds, lockers, and setting up the rooftop cafe.",
    status: "completed" 
  },
  {
    date: "December 2025",
    title: "Staff Hiring & Training",
    desc: "Hiring property manager and housekeeping staff. Onboarding onto Zostel OS system.",
    status: "completed"
  },
  {
    date: "February 2026", 
    title: "Grand Launch",
    desc: "Property went live. Initial occupancy exceeded 85% in the first week.",
    status: "completed"
  },
  {
    date: "April 2026",
    title: "First Payout Cycle",
    desc: "Distribution of profits to partners based on Q1 actual revenue share.",
    status: "completed"
  },
  {
    date: "July 2026",
    title: "Quarterly Review",
    desc: "Performance audit and optimization of F&B secondary revenue streams.",
    status: "upcoming"
  }
];

const PHOTOS = [
  "/opportunities/hospitality/zostel-varanasi/photo-1.png",
  "/opportunities/hospitality/zostel-varanasi/photo-2.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-3.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-4.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-5.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-6.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-7.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-8.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-9.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-10.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-11.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-12.jpg",
  "/opportunities/hospitality/zostel-varanasi/photo-13.jpg",
];

export default function VaranasiZostelPage({ filledPct }: { filledPct: number | null }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const prevPhoto = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((i) => (i - 1 + PHOTOS.length) % PHOTOS.length);
  }, []);

  const nextPhoto = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((i) => (i + 1) % PHOTOS.length);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + PHOTOS.length) % PHOTOS.length);
      else if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % PHOTOS.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, closeLightbox]);

  return (
    <div className="bg-gray-50 min-h-screen font-sans selection:bg-[#05CE78] selection:text-white pb-32">
      
      {/* --- FLOATING CTA --- */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center pointer-events-none pb-6 sm:pb-8 px-4">
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-2xl border border-gray-100 pointer-events-auto transition-transform hover:scale-105 active:scale-95 w-full max-w-sm sm:w-auto">
          <Link
            href="/opportunities/hospitality/varanasi-zostel/business-model"
            className="flex items-center justify-center gap-3 bg-[#05CE78] text-white px-6 py-3.5 rounded-2xl font-bold text-lg shadow-[0_0_0_1px_rgba(5,206,120,0.3),0_0_40px_rgba(5,206,120,0.45),0_0_80px_rgba(5,206,120,0.2)] hover:shadow-[0_0_0_1px_rgba(5,206,120,0.4),0_0_60px_rgba(5,206,120,0.6),0_0_120px_rgba(5,206,120,0.3)] hover:bg-[#04b067] transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="whitespace-nowrap">View Financials</span>
          </Link>
        </div>
      </div>

      {/* --- DARK HERO SECTION --- */}
      <section className="relative bg-[#0B1120] pt-24 pb-32 md:pb-48 overflow-hidden">
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
          <Link 
            href="/opportunities/hospitality" 
            className="inline-flex items-center text-gray-400 hover:text-white font-medium transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> 
            Back to Hospitality Portfolio
          </Link>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-[#05CE78] rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              <Building2 className="w-3 h-3" /> Live Deal
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Zostel <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05CE78] to-emerald-400">Varanasi</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
              Acquire equity in a premium backpacker hostel located in India's spiritual capital. 
              High occupancy asset driven by the "Kashi Vishwanath Corridor" tourism boom.
            </p>
          </div>
        </div>
      </section>

      {/* --- STATS CARD (Overlapping) --- */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-32">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="text-center md:text-left md:pr-4">
              <div className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">Total Project Value</div>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900">₹60 Lakhs</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-[#05CE78] rounded-lg text-xs font-bold">
                 <Zap className="w-3 h-3" /> Fully Operational
              </div>
            </div>
            <div className="text-center md:px-4 pt-6 md:pt-0">
              <div className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">Target Annual ROI</div>
              <div className="text-3xl md:text-4xl font-extrabold text-[#05CE78]">28% - 32%</div>
              <div className="mt-2 text-xs text-gray-500 font-medium">
                Driven by 85%+ Avg Occupancy
              </div>
            </div>
            <div className="text-center md:text-right md:pl-4 pt-6 md:pt-0">
              <div className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">Min. Investment</div>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900">₹5 Lakhs</div>
              <div className="mt-2 text-xs text-gray-500 font-medium">
                ~8% Profit Share per slot
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
              <div
                className={`h-full rounded-full transition-all duration-1000 ${filledPct >= 100 ? "bg-gray-400" : "bg-[#05CE78]"}`}
                style={{ width: `${Math.min(100, filledPct)}%` }}
              />
            </div>
            {filledPct >= 100 && (
              <p className="text-xs text-gray-400 mt-2 font-medium">This pool is fully funded.</p>
            )}
          </div>
        </section>
      )}

      {/* --- PARTNER LOGOS --- */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Franchise & Booking Partners</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { name: "Zostel", tag: "Franchise", logo: "/brands/zostel.png" },
              { name: "Booking.com", tag: "OTA", logo: "/brands/booking.png" },
              { name: "Hostelworld", tag: "OTA", logo: "/brands/hostelworld.png" },
              { name: "MakeMyTrip", tag: "OTA", logo: "/brands/makemytrip.png" },
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

      {/* --- PROPERTY PHOTO GALLERY --- */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Live Property</p>
              <h2 className="text-xl font-bold text-gray-900">Property Photos</h2>
            </div>
            <a
              href="https://www.zostel.com/destination/varanasi/stay/zostel-varanasi-vrnh142?gallery=operator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#05CE78] hover:underline flex items-center gap-1"
            >
              View on Zostel <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Mosaic grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 auto-rows-[180px]">
            {/* Large featured */}
            <div
              className="col-span-2 row-span-2 rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(0)}
            >
              <img
                src={PHOTOS[0]}
                alt="Zostel Varanasi"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            {/* Smaller grid photos */}
            {PHOTOS.slice(1).map((src, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(i + 1)}
              >
                <img
                  src={src}
                  alt={`Zostel Varanasi ${i + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- INVESTMENT THESIS --- */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            
            {/* Left: Narrative */}
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-1 bg-[#05CE78] rounded-full" />
                <span className="text-[#05CE78] font-bold text-sm uppercase tracking-widest">Market Thesis</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Why we are betting big on <br/>
                <span className="text-[#05CE78]">The Kashi Boom</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Varanasi has fundamentally changed. The <strong>Double Engine Government</strong> has deployed massive infrastructure upgrades, creating a structural shortage of premium accommodation for the 15 Crore+ annual visitors.
              </p>
              
              <div className="bg-green-50 border border-green-100 p-5 rounded-2xl flex items-start gap-4">
                 <div className="p-2 bg-white rounded-lg text-[#05CE78] shadow-sm">
                   <TrendingUp className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-900">Year-Round Peak Demand</h4>
                   <p className="text-sm text-gray-600 mt-1">
                     Unlike hill stations with seasonality, Kashi sees consistent religious and cultural tourism 365 days a year.
                   </p>
                 </div>
              </div>
            </div>

            {/* Right: Data Grid with UPDATED STATS */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              
              {/* UPDATED: Annual Visitors Growth Card */}
              <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex justify-between items-start mb-4">
                  <Users className="text-[#05CE78] w-8 h-8" />
                  <span className="inline-flex items-center text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> 36%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">15 Cr+</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">2025 Visitors</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">
                  vs 11 Cr (2024)
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
                <TrendingUp className="text-[#05CE78] w-8 h-8 mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-1">#1</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tourist Growth</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">In Uttar Pradesh</div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
                <MapPin className="text-[#05CE78] w-8 h-8 mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-1">30%</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Intl. Travelers</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">High Dollar Revenue</div>
              </div>

              <div className="bg-[#0B1120] p-6 rounded-3xl shadow-lg shadow-gray-900/20 border border-gray-800 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#05CE78] opacity-10 rounded-full blur-2xl -mr-8 -mt-8" />
                <BarChart3 className="text-[#05CE78] w-8 h-8 mb-4 relative z-10" />
                <div className="text-3xl font-bold text-white mb-1 relative z-10">85%+</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider relative z-10">Peak Occupancy</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- TIMELINE --- */}
      <ProjectTimeline data={zostelTimeline} title="Zostel Launch Roadmap" />

      {/* --- ASSET & DNA SECTION --- */}
      <section className="py-16 md:py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The Asset DNA</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A 21-room property engineered for yield, featuring social zones, distinct sleeping categories, and revenue-generating F&B outlets.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
            
            {/* --- LEFT: MAP CARD (Layered) --- */}
            <div className="group relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 h-[300px] md:h-[500px]">
              
              {/* LAYER 1 (Bottom): Live Google Map (Mona Lisa Cafe) */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.012847260932!2d83.00448511091963!3d25.303772427282567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x398e2e03cfa0bbdb%3A0x1558a4974d832cb5!2sZostel%20Varanasi!5e0!3m2!1sen!2sus!4v1770749386054!5m2!1sen!2sus"
                width="100%"
                height="100%"
                className="absolute inset-0 border-0 w-full h-full grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                allowFullScreen
                loading="lazy"
                title="Property Location"
              />

              {/* LAYER 2 (Top): Location Pin Image (Fades out on Hover) */}
              <div className="absolute inset-0 bg-white z-10 transition-opacity duration-500 opacity-100 group-hover:opacity-0 pointer-events-none group-hover:pointer-events-none">
                <Image 
                  src={locationPin} 
                  alt="Prime Location Map" 
                  fill 
                  className="object-cover"
                />
                
                {/* Overlay Badge */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                   <span className="bg-white/90 backdrop-blur-md text-gray-900 px-6 py-3 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-8 transition-transform duration-500">
                     <MapPin className="w-4 h-4 text-[#05CE78]" /> Hover to Explore Map
                   </span>
                </div>
              </div>

              {/* Top Floating Badge (Always Visible) */}
              <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 border border-gray-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                Right Next to Mona Lisa Cafe
              </div>
            </div>

            {/* --- RIGHT: AMENITIES --- */}
            <div className="space-y-6 md:space-y-8">
               
               {/* Amenities Grid */}
               <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-[#05CE78]" /> Premium Amenities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Double Terrace Cafe", sub: "Ganga View F&B" },
                      { label: "Play Area & Chill Zone", sub: "Social Hub" },
                      { label: "Co-working Space", sub: "High-Speed WiFi" },
                      { label: "Private Suites", sub: "Premium Rooms" }
                    ].map((item, i) => (
                       <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#05CE78]" />
                          <div>
                            <div className="font-bold text-gray-800 text-sm">{item.label}</div>
                            <div className="text-xs text-gray-500">{item.sub}</div>
                          </div>
                       </div>
                    ))}
                  </div>
               </div>

               {/* Operational Highlight */}
               <div className="bg-[#0B1120] p-6 rounded-3xl text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="font-bold text-lg mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#05CE78]" /> Operational Strength
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Our <strong>Double Terrace Cafeteria</strong> creates a secondary revenue stream (25% of total) by attracting walk-in tourists, not just hostel guests.
                    </p>
                  </div>
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#05CE78] blur-[60px] opacity-20 pointer-events-none" />
               </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- INVENTORY MIX (Separate for Clarity) --- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-2xl font-bold text-gray-900">Inventory Configuration</h3>
             <div className="text-sm font-bold text-[#05CE78] bg-green-50 px-3 py-1 rounded-full border border-green-100">
               Total: 57 Beds
             </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { type: "4 Bed Dorm", count: 7, total: 28 },
              { type: "6 Bed Dorm", count: 3, total: 18 },
              { type: "Twin Sharing", count: 2, total: 2 },
              { type: "Deluxe Room", count: 6, total: 6 },
              { type: "Premium Room", count: 3, total: 3 },
            ].map((room, idx) => (
              <div key={idx} className="bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-sm hover:border-[#05CE78] hover:shadow-md transition-all cursor-default">
                <div className="bg-white rounded-xl p-4 flex flex-col items-center text-center h-full justify-center">
                  <div className="text-3xl font-extrabold text-[#05CE78] mb-2">
                    {room.count}
                  </div>
                  <div className="font-bold text-gray-900 text-xs uppercase tracking-wide mb-1">{room.type}</div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{room.total} Total Beds</div>
                </div>
              </div>
            ))}
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#05CE78] opacity-10 blur-[150px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Don't Miss the Kashi Wave.</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Varanasi is witnessing a generational tourism shift. Slots in this asset are filling up rapidly through our private investor network.
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
               href="/opportunities/hospitality/varanasi-zostel/business-model"
               className="bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-4 h-4" /> ROI Simulator
            </Link>
          </div>
        </div>
      </section>

      {/* --- PHOTO LIGHTBOX --- */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-5 right-5 p-3 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition z-50"
            onClick={closeLightbox}
          >
            <X size={22} />
          </button>

          {/* Prev */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition z-50"
            onClick={prevPhoto}
          >
            <ChevronLeft size={32} />
          </button>

          {/* Image */}
          <div
            className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={PHOTOS[lightboxIndex]}
              alt={`Zostel Varanasi ${lightboxIndex + 1}`}
              className="w-full h-full max-h-[85vh] object-contain"
            />
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="bg-black/60 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
                {lightboxIndex + 1} / {PHOTOS.length}
              </span>
            </div>
          </div>

          {/* Next */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition z-50"
            onClick={nextPhoto}
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </div>
  );
}