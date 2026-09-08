"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Opportunities", href: "/opportunities" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5 py-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]"
          : "bg-transparent py-5 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          
          {/* --- LOGO SECTION --- */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-7 h-7 transition-transform group-hover:scale-105 shrink-0">
              <Image
                src="/logo.svg"
                alt="Hustlers Ventures"
                fill
                sizes="28px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-none gap-px">
              <span className="text-[17px] font-extrabold tracking-tight text-white group-hover:text-[#05CE78] transition-colors">
                HUSTLERS
              </span>
              <span className="text-[11px] font-bold tracking-[0.18em] text-white/55 uppercase group-hover:text-white transition-colors">
                Ventures
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive 
                        ? "text-[#05CE78] bg-white/10 font-bold" 
                        : "text-white hover:text-[#05CE78] hover:bg-white/10"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Auth CTAs */}
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#05CE78] to-[#04b067] text-[#0B1120] text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(5,206,120,0.4)] hover:shadow-[0_0_25px_-2px_rgba(5,206,120,0.6)] active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Login
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#05CE78] to-[#04b067] text-[#0B1120] text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(5,206,120,0.4)] hover:shadow-[0_0_25px_-2px_rgba(5,206,120,0.6)] active:scale-[0.98]"
                >
                  <User className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={28}/> : <Menu size={28}/>}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#0B1120] border-b border-white/10 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-6 space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive 
                      ? "bg-[#05CE78]/10 text-[#05CE78] border border-[#05CE78]/20" 
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-white/10">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#05CE78] to-[#04b067] text-[#0B1120] font-bold transition-all shadow-[0_0_20px_-5px_rgba(5,206,120,0.4)] hover:shadow-[0_0_25px_-2px_rgba(5,206,120,0.6)] active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Login
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#05CE78] to-[#04b067] text-[#0B1120] font-bold transition-all shadow-[0_0_20px_-5px_rgba(5,206,120,0.4)] hover:shadow-[0_0_25px_-2px_rgba(5,206,120,0.6)] active:scale-[0.98]"
                >
                  <User className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}