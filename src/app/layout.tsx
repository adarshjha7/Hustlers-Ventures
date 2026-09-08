import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Or your font
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hustlersventures.co";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hustlers Ventures",
    template: "%s | Hustlers Ventures",
  },
  description:
    "Co-own high-yield real-world assets across Transportation, Hospitality, and F&B. Powered by Data-Driven & Tech-Enabled Execution.",
  keywords: [
    "alternative investments",
    "real-world assets",
    "co-ownership",
    "passive income",
    "intercity fleet",
    "hospitality investment",
    "highway F&B",
    "Zostel",
    "Hustlers Ventures",
    "fractional investing",
  ],
  authors: [{ name: "Hustlers Ventures", url: siteUrl }],
  creator: "Hustlers Ventures",
  publisher: "Hustlers Ventures",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Hustlers Ventures",
    title: "Hustlers Ventures - Co-own High-Yield Real-World Assets",
    description:
      "Invest in institutional-grade assets across Intercity Transportation, Hospitality, and Highway F&B. Data-driven execution, transparent returns.",
    images: [
      {
        url: "/hero-bg.png",
        width: 1200,
        height: 630,
        alt: "Hustlers Ventures - High-Yield Real-World Asset Investments",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hustlers Ventures - Co-own High-Yield Real-World Assets",
    description:
      "Invest in institutional-grade assets across Intercity Transportation, Hospitality, and Highway F&B. Data-driven execution, transparent returns.",
    images: ["/hero-bg.png"],
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}