import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zostel Varanasi - Hospitality",
  description:
    "Co-own a premium 6-storey Zostel hostel in Varanasi - one of India's highest-footfall spiritual destinations. Strong occupancy, consistent returns.",
  openGraph: {
    title: "Zostel Varanasi - Hospitality Investment | Hustlers Ventures",
    description:
      "Co-own a premium 6-storey Zostel hostel in Varanasi - one of India's highest-footfall spiritual destinations. Strong occupancy, consistent returns.",
    images: [{ url: "/assets/zostel-varanasi.png", width: 1200, height: 630 }],
  },
};

export default function VaranasiZostelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
