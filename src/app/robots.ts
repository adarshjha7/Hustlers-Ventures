import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://hustlersventures.co";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/settings/", "/portfolio/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
