import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investment Opportunities",
  description:
    "Browse active co-ownership opportunities across Intercity Transportation, Hospitality, and Highway F&B. Institutional-grade assets with transparent returns.",
  openGraph: {
    title: "Investment Opportunities - Hustlers Ventures",
    description:
      "Browse active co-ownership opportunities across Intercity Transportation, Hospitality, and Highway F&B.",
    images: [{ url: "/hero-bg.png", width: 1200, height: 630 }],
  },
};

export default function OpportunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
