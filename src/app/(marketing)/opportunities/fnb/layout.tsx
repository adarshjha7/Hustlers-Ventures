import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Highway F&B Investment",
  description:
    "Co-own high-footfall highway restaurants at strategic locations across India. Consistent revenue driven by captive highway traffic.",
  openGraph: {
    title: "Highway F&B Investment - Hustlers Ventures",
    description:
      "Co-own high-footfall highway restaurants at strategic locations across India. Consistent revenue driven by captive highway traffic.",
    images: [{ url: "/opportunities/fnb-thumbnail.png", width: 1200, height: 630 }],
  },
};

export default function FnbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
