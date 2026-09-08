import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Hustlers Ventures",
  description:
    "Privacy policy for Hustlers Ventures. Learn how we collect, use, and protect your personal information on our investor platform.",
  openGraph: {
    title: "Privacy Policy | Hustlers Ventures",
    description:
      "Learn how Hustlers Ventures collects, uses, and protects your personal information.",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
