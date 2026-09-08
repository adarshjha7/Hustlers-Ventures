import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hustlers Portfolio",
  description:
    "Diversified co-ownership portfolios across Transportation, Hospitality, and F&B. Spread risk across multiple high-yield real-world assets.",
  openGraph: {
    title: "Hustlers Portfolio - Hustlers Ventures",
    description:
      "Diversified co-ownership portfolios across Transportation, Hospitality, and F&B. Spread risk across multiple high-yield real-world assets.",
    images: [{ url: "/portfolio/portfolio.png", width: 1200, height: 630 }],
  },
};

export default function HustlersPortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
