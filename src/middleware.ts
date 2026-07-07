import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes — everything else requires auth
const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/api/webhooks(.*)",   // Clerk + Stripe webhooks are verified internally
  "/courts(.*)",         // browsing courts is public
  "/events(.*)",         // browsing events is public
]);

// Admin-only routes
const isAdmin = createRouteMatcher(["/admin(.*)"]);

// Court manager routes
const isCourtManager = createRouteMatcher(["/manage/courts(.*)"]);

// Event manager routes
const isEventManager = createRouteMatcher(["/manage/events(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isPublic(req)) return NextResponse.next();

  const { userId, sessionClaims } = await auth.protect();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (isAdmin(req) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (isCourtManager(req) && role !== "COURT_MANAGER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (isEventManager(req) && role !== "EVENT_MANAGER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"]
};
