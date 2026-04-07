import type { MetadataRoute } from "next";
import { getConfig } from "@/lib/property";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://localhost:3000";
  // Strip trailing slash
  baseUrl = baseUrl.replace(/\/$/, "");

  // Try to read the config for the last-modified hint; fail gracefully
  let lastModified: Date;
  try {
    await getConfig();
    lastModified = new Date();
  } catch {
    lastModified = new Date();
  }

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
