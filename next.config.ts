import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers applied to every route
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://clerk.padelflow.com https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://utfs.io https://img.clerk.com",
              "connect-src 'self' https://api.clerk.dev https://clerk.padelflow.com wss://*.pusher.com https://api.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { hostname: "utfs.io" },
      { hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
