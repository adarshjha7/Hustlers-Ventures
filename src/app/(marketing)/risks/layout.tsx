import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Disclosure - Hustlers Ventures",
  description:
    "Important risk disclosure for Hustlers Ventures investors. Understand the risks associated with investing in real-world asset pools before committing capital.",
  openGraph: {
    title: "Risk Disclosure | Hustlers Ventures",
    description:
      "Important risk disclosure for Hustlers Ventures investors. Understand the risks before investing.",
  },
};

export default function RisksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
