import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/dashboard/",
          "/*/admin/",
          "/*/monitores/portal/",
          "/*/favoritos",
        ],
      },
    ],
    sitemap: "https://www.hellocamp.pt/sitemap.xml",
    host: "https://www.hellocamp.pt",
  };
}