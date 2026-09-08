import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debt Funds | Hustlers Ventures",
  description:
    "Fixed-income debt instruments backed by real business cash flows. Earn predictable quarterly returns with asset-backed security.",
  openGraph: {
    title: "Debt Fund Investments | Hustlers Ventures",
    description:
      "Fixed-income debt instruments backed by real business cash flows. Earn predictable quarterly returns with asset-backed security.",
    images: [{ url: "/opportunities/debt-funds-thumbnail.png", width: 1200, height: 630 }],
  },
};

export default function DebtFundsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
