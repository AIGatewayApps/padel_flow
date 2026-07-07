import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/uploadthing(.*)",
  "/api/health",
  "/courts(.*)",
  "/events(.*)",
  "/leaderboard(.*)",
  "/players(.*)",
  "/clubs(.*)",
  "/coaches(.*)",
  "/sitemap.xml",
  "/robots.txt",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

// Role-protected portals
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isCoachRoute = createRouteMatcher(["/coach-portal(.*)"]);
const isCourtManagerRoute = createRouteMatcher(["/court-manager-portal(.*)"]);
const isEventManagerRoute = createRouteMatcher(["/event-manager-portal(.*)"]);
const isVendorRoute = createRouteMatcher(["/vendor(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();

  const { userId, sessionClaims } = await auth();
  const meta = sessionClaims?.metadata as
    | { onboarded?: boolean; role?: string }
    | undefined;

  // Intentional: public routes (leaderboard, clubs, players, coaches) are
  // viewable by non-onboarded users. Only private routes force onboarding.
  // To change this behaviour, replace `!isPublicRoute(req)` with `true`.
  if (userId && !isOnboardingRoute(req) && !isPublicRoute(req)) {
    if (!meta?.onboarded) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // Role-based portal guards
  if (userId && meta?.onboarded) {
    const role = meta.role;

    if (isAdminRoute(req) && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (isCoachRoute(req) && role !== "coach" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (
      isCourtManagerRoute(req) &&
      role !== "court_manager" &&
      role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (
      isEventManagerRoute(req) &&
      role !== "event_manager" &&
      role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (isVendorRoute(req) && role !== "vendor" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  const res = NextResponse.next();

  // Security headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // unsafe-eval removed — if Clerk dev mode requires it, scope only to *.clerk.accounts.dev
      "script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://clerk.com https://*.clerk.accounts.dev wss://*.pusher.com https://sockjs-*.pusher.com https://api.stripe.com https://uploadthing.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "media-src 'self' blob: https:",
    ].join("; ")
  );
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=()"
  );

  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
