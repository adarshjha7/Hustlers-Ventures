"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, TrendingUp, ScrollText, Wallet,
  Layers, Lightbulb, Tag, Megaphone, Landmark, Gift, MessageCircle, DatabaseBackup, LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_SECTIONS: { heading?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/admin",             label: "Overview",    icon: LayoutDashboard, exact: true },
    ],
  },
  {
    heading: "Investors",
    items: [
      { href: "/admin/investors",   label: "Investors",   icon: Users },
      { href: "/admin/investments", label: "Investments", icon: TrendingUp },
      { href: "/admin/payouts",     label: "Payouts",     icon: Wallet },
      { href: "/admin/pools",       label: "Pools",       icon: Layers },
      // { href: "/admin/loans",       label: "Loans",       icon: Landmark },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/broadcasts",             label: "Broadcasts",  icon: Megaphone },
      { href: "/admin/opportunities",          label: "Opportunities", icon: Lightbulb },
      { href: "/admin/opportunity-categories", label: "Categories",  icon: Tag },
      { href: "/admin/referral-interest",      label: "Referral",    icon: Gift },
    ],
  },
  {
    heading: "Support",
    items: [
      { href: "/admin/support", label: "Support Tickets", icon: MessageCircle },
    ],
  },
  {
    heading: "System",
    items: [
      { href: "/admin/logs",    label: "Logs",    icon: ScrollText },
      { href: "/admin/backups", label: "Backups", icon: DatabaseBackup },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
      {NAV_SECTIONS.map((section, si) => (
        <div key={si}>
          {section.heading && (
            <p className="px-3 text-xs font-bold text-white/25 uppercase tracking-[0.2em] mb-1.5">
              {section.heading}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map(item => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold
                    tracking-tight transition-all duration-150 group
                    ${isActive
                      ? "bg-[#05CE78]/12 text-[#05CE78]"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    }
                  `}
                >
                  <item.icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-[#05CE78]" : "text-gray-500 group-hover:text-[#05CE78]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#05CE78] shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
