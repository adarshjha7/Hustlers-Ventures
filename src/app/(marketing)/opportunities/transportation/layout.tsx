import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intercity Transportation",
  description:
    "Co-own intercity bus fleets generating consistent monthly returns. Data-driven fleet operations across high-demand highway corridors.",
  openGraph: {
    title: "Intercity Transportation Investment - Hustlers Ventures",
    description:
      "Co-own intercity bus fleets generating consistent monthly returns. Data-driven fleet operations across high-demand highway corridors.",
    images: [{ url: "/opportunities/transportation-thumbnail.png", width: 1200, height: 630 }],
  },
};

export default function TransportationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
