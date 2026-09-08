import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hustlers Alpha - Portfolio Fund",
  description:
    "Hustlers Alpha is a curated multi-asset portfolio combining intercity fleet, hospitality, and F&B for diversified passive income.",
  openGraph: {
    title: "Hustlers Alpha - Portfolio Fund | Hustlers Ventures",
    description:
      "Hustlers Alpha is a curated multi-asset portfolio combining intercity fleet, hospitality, and F&B for diversified passive income.",
    images: [{ url: "/portfolio/portfolio-alpha-cover.png", width: 1200, height: 630 }],
  },
};

export default function HustlersAlphaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
