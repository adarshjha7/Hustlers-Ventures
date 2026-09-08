import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hospitality Investment",
  description:
    "Co-own premium hostel properties across India's top travel destinations. Institutional-grade hospitality assets with strong occupancy rates.",
  openGraph: {
    title: "Hospitality Investment - Hustlers Ventures",
    description:
      "Co-own premium hostel properties across India's top travel destinations. Institutional-grade hospitality assets with strong occupancy rates.",
    images: [{ url: "/opportunities/hospitality-thumbnail.png", width: 1200, height: 630 }],
  },
};

export default function HospitalityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
