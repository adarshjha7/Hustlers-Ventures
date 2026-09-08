import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - Hustlers Ventures",
  description:
    "Get in touch with the Hustlers Ventures team. Reach out for investment inquiries, partnership opportunities, or general questions.",
  openGraph: {
    title: "Contact Hustlers Ventures",
    description:
      "Get in touch with the Hustlers Ventures team for investment inquiries and partnership opportunities.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
