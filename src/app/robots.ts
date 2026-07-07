import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://padelflow.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courts", "/events", "/players", "/leaderboard", "/clubs", "/coaches"],
        disallow: [
          "/admin",
          "/dashboard",
          "/onboarding",
          "/settings",
          "/messages",
          "/notifications",
          "/api/",
          "/coach-portal",
          "/court-manager-portal",
          "/event-manager-portal",
          "/vendor",
          "/org",
          "/manage",
          "/pro",
          "/scores",
          "/bookings",
          "/feed",
          "/friends",
          "/live",
          "/ai-suggest",
          "/challenges",
          "/shop",
          "/ads",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
