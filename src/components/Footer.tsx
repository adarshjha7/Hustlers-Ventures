"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone 
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0B1120] border-t border-white/10 pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 opacity-90 group-hover:opacity-100 transition-opacity">
                {/* Ensure your logo works on dark backgrounds */}
                <Image
                  src="/logo.svg"
                  alt="Hustlers Ventures Logo"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-white leading-none group-hover:text-[#05CE78] transition-colors">
                  HUSTLERS
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase group-hover:text-white transition-colors">
                  Ventures
                </span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              We build and manage high-yield assets across Transportation, Hospitality, and F&B, delivering predictable passive income to our investors.
            </p>
            <div className="flex gap-4">
              {[Linkedin].map((Icon, i) => (
                <a 
                  key={i}
                  href="#" 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#05CE78] hover:border-[#05CE78] transition-all"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div>
            <h3 className="font-bold text-white mb-6">Platform</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/opportunities" className="hover:text-[#05CE78] transition-colors">Browse Opportunities</Link></li>
              <li><Link href="/about" className="hover:text-[#05CE78] transition-colors">How it Works</Link></li>
              <li><Link href="/about" className="hover:text-[#05CE78] transition-colors">Our Team</Link></li>
              <li><Link href="/login" className="hover:text-[#05CE78] transition-colors">Investor Login</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div>
            <h3 className="font-bold text-white mb-6">Legal</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/privacy" className="hover:text-[#05CE78] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#05CE78] transition-colors">Terms of Service</Link></li>
              <li><Link href="/risks" className="hover:text-[#05CE78] transition-colors">Risk Disclosure</Link></li>
              <li><Link href="/contact" className="hover:text-[#05CE78] transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-bold text-white mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-3 group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#05CE78]/20 transition-colors">
                  <Mail size={16} className="text-[#05CE78]" />
                </div>
                <a href="mailto:investments@hustlersventures.co" className="hover:text-white transition-colors">investments@hustlersventures.co</a>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#05CE78]/20 transition-colors">
                  <Phone size={16} className="text-[#05CE78]" />
                </div>
                <a href="tel:+919000272020" className="hover:text-white transition-colors">+91 90002 72020</a>
              </li>
              <li className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Registered Office</p>
                <p className="text-gray-300">Hyderabad, Telangana, India.</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-8"></div>

        {/* Bottom Section: Disclaimer & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500">
          <p className="font-medium">
            © {currentYear} Hustlers Ventures. All rights reserved.
          </p>
          <p className="max-w-xl text-center md:text-right opacity-60 hover:opacity-100 transition-opacity cursor-default">
            Disclaimer: Investments in alternative assets involve risks, including loss of capital. 
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
}