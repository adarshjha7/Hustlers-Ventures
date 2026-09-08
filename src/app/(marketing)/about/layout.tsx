import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Hustlers Ventures",
  description:
    "Learn about Hustlers Ventures - our mission to transform unorganized sectors into institutional-grade investment assets across transportation, hospitality, and F&B.",
  openGraph: {
    title: "About Hustlers Ventures",
    description:
      "Learn about Hustlers Ventures - our mission to transform unorganized sectors into institutional-grade investment assets.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
