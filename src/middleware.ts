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

  if (!isPublicRoute(req)) await auth.protect();

  // Redirect unonboarded users — use !onboarded so undefined (new users) also redirect
  if (userId && !isOnboardingRoute(req) && !isPublicRoute(req)) {
    const onboarded = (sessionClaims?.metadata as { onboarded?: boolean })?.onboarded;
    if (!onboarded) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Allow camera + microphone for QR scanner and video sessions
  res.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"]
};
