import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pool 6 - Intercity Fleet",
  description:
    "Invest in Pool 6, a high-yield intercity bus fleet operating across premium highway corridors. Fixed monthly payouts backed by real operational data.",
  openGraph: {
    title: "Pool 6 - Intercity Fleet Investment | Hustlers Ventures",
    description:
      "Invest in Pool 6, a high-yield intercity bus fleet operating across premium highway corridors. Fixed monthly payouts backed by real operational data.",
    images: [{ url: "/opportunities/transportation-thumbnail.png", width: 1200, height: 630 }],
  },
};

export default function Pool6Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
