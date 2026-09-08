import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onya Diamonds | Hustlers Ventures",
  description:
    "Co-own a premium branded jewellery business. Revenue-share investment in Onya Diamonds — high-margin retail, quarterly payouts, and real asset backing.",
  openGraph: {
    title: "Onya Diamonds | Hustlers Ventures",
    description:
      "Co-own a premium branded jewellery business. Revenue-share investment in Onya Diamonds — high-margin retail, quarterly payouts, and real asset backing.",
    images: [{ url: "/opportunities/jewellery/onya-diamonds.png", width: 1200, height: 630 }],
  },
};

export default function OnyaDiamondsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
