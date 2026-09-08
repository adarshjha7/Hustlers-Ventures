import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debt Fund Series 1 | Hustlers Ventures",
  description:
    "Earn 12–16% p.a. fixed returns through a secured structured debt instrument backed by operational business assets. Quarterly payouts, 24-month tenure.",
  openGraph: {
    title: "Debt Fund Series 1 | Hustlers Ventures",
    description:
      "Earn 12–16% p.a. fixed returns through a secured structured debt instrument backed by operational business assets. Quarterly payouts, 24-month tenure.",
    images: [{ url: "/opportunities/debt-funds/debt-fund-series-1.png", width: 1200, height: 630 }],
  },
};

export default function DebtFundSeries1Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
