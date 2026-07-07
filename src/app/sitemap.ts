import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://padelflow.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/courts`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/players`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/clubs`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/coaches`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  return staticRoutes;
}
