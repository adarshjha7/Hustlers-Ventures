import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Hustlers Ventures",
  description:
    "Terms of service governing the use of Hustlers Ventures platform and participation in investment opportunities.",
  openGraph: {
    title: "Terms of Service | Hustlers Ventures",
    description:
      "Terms of service governing the use of Hustlers Ventures platform and investment participation.",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
