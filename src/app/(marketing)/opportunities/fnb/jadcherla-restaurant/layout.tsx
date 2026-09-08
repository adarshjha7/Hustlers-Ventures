import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadcherla Restaurant - Highway F&B",
  description:
    "Co-own a high-footfall highway restaurant in Jadcherla on the Hyderabad-Bengaluru corridor. Captive traffic, proven revenue, monthly distributions.",
  openGraph: {
    title: "Jadcherla Restaurant - Highway F&B | Hustlers Ventures",
    description:
      "Co-own a high-footfall highway restaurant in Jadcherla on the Hyderabad-Bengaluru corridor. Captive traffic, proven revenue, monthly distributions.",
    images: [{ url: "/assets/jadcherla.png", width: 1200, height: 630 }],
  },
};

export default function JadcherlaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
