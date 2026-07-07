import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/", "/sign-in(.*)", "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/uploadthing(.*)",
  "/courts(.*)", "/events(.*)", "/leaderboard(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Enforce auth on protected routes
  if (!isPublicRoute(req)) await auth.protect();

  // Redirect unonboarded users to onboarding (except onboarding itself)
  if (userId && !isOnboardingRoute(req) && !isPublicRoute(req)) {
    const onboarded = (sessionClaims?.metadata as { onboarded?: boolean })?.onboarded;
    // Fallback: check DB if session claim not set yet
    // (Clerk propagates metadata on next sign-in, so fresh users hit DB once)
    if (onboarded === false) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  const res = NextResponse.next();
  // Security headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"]
};
